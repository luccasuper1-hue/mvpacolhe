# Fase 2 — autorização e isolamento multi-institucional

Data: 2026-10-30  
Branch: `audit/phase2-authz-isolation`  
Ambiente: somente código local e dados sintéticos. Nenhum deploy ou acesso a produção foi realizado.

## Vulnerabilidade confirmada e corrigida — conta institucional ativa por senha direta

- **Evidência:** `cloudflare-worker/src/routes.ts` e `backend/app/routers/admin.py` aceitavam `admin_password`; o Worker gravava `role: institution`, `active: Boolean(adminPassword)` e hash de senha. O backend Python gravava `active: True`.
- **Cenário reproduzível:** um administrador autenticado enviava `POST /api/admin/institutions` com `admin_email` e `admin_password`; a conta institucional podia entrar sem abrir convite nem aceitar termos de privacidade/termo de perfil.
- **Severidade/impacto:** P1 (alto). Não era escalada para `admin`, mas criava uma identidade institucional ativa fora do fluxo de convite, reduzindo rastreabilidade e permitindo acesso imediato aos dados da instituição criada.
- **Correção:** o campo de senha direta é rejeitado quando não vazio. A criação com e-mail gera sempre conta `active=false`, `password_hash=""`, token aleatório e expiração de 14 dias. A ativação só ocorre em `/auth/invite/:token/accept` após termos, política e termo específico de perfil.
- **Teste:** `backend/tests/test_phase2_authorization.py::test_admin_cannot_activate_institution_by_direct_password` e `::test_institution_account_is_pending_until_invite_acceptance` cobrem rejeição e estado pendente. A verificação estática confirmou que o Worker não usa mais o valor recebido para definir `active` ou `password_hash`.
- **Resultado pós-correção:** TypeScript e build do frontend passaram; os testes Python foram coletados, mas a execução assíncrona não pôde completar neste Windows/Python 3.13 devido ao bloqueio do event loop Proactor (`asyncio.run` trava ao criar o loop). Isso permanece uma limitação documentada, não um resultado de aprovação de integração.

## Vulnerabilidade confirmada e corrigida — aceite de convite sem termos no backend Python

- **Evidência:** `backend/app/routers/auth.py::accept_invite` aceitava apenas senha; `InviteAccept` não possuía campos de aceite.
- **Cenário reproduzível:** token válido de profissional/instituição + senha permitia ativação sem `terms_accepted`, `privacy_accepted` ou `role_terms_accepted`.
- **Severidade/impacto:** P1 (alto), pois o backend Python divergia do Worker e ativava perfis profissionais/institucionais sem evidência de aceite.
- **Correção:** `InviteAccept` agora exige os três booleanos; termos e política são obrigatórios para todos os convites e o termo específico é obrigatório para `professional`/`institution`. As datas são persistidas no usuário.
- **Teste:** `backend/tests/test_auth_token_security.py::test_professional_invite_requires_role_terms` reproduz a rejeição; os testes de aceite existentes foram atualizados para dados sintéticos com os três aceites.

## Escalada de privilégios

Não foi encontrada rota que converta `student`, `professional` ou `institution` em `admin`: `require_roles`/`userWithRole` restringem `/admin/*` e `/metrics/global` ao papel `admin`. O cadastro público cria somente `student`; convites criam somente o papel fixado pelo servidor.

## IDOR/BOLA e isolamento entre instituições

Na revisão estática, as rotas de estudante/profissional usam o perfil derivado do token e filtram por `student_id`, `professional_id` e `institution_id`. Rotas institucionais derivam a instituição de `user.institution_id`, sem aceitar um ID de instituição vindo do cliente. Não há vulnerabilidade confirmada por inspeção estática.

**Teste dinâmico executado:** `backend/tests/test_phase2_dynamic_isolation.py` criou dois estudantes, dois profissionais e duas instituições sintéticas em um banco em memória e executou os handlers reais. Resultado: 4 passed. Foram observados somente os próprios registros para cada instituição/perfil; o feedback de sessão da outra instituição retornou `HTTPException 404`; a métrica de A contou apenas dados de A; papel institucional tentando a dependência administrativa retornou `HTTPException 403`.

**Teste HTTP do Worker executado:** Wrangler iniciou o Worker localmente em `127.0.0.1:8798` e o gateway persistente local em `127.0.0.1:8799` gravou os documentos em JSON entre requisições. O gateway implementa o mesmo contrato de operações usado pelo `MongoGateway` (find, insert, update, remove, count, distinct e findOneAndUpdate); não é um mock em memória dentro do teste. A suíte `cloudflare-worker/scripts/phase2-worker-dynamic.mjs` autenticou contas sintéticas e executou **36 asserções aprovadas**. Incluiu dois estudantes, dois profissionais, duas instituições e um administrador; listagens, solicitações, sessões, encaminhamento, feedback, métricas, convite, recuperação de senha, token expirado/reutilizado e tentativa de privilégio foram validados por HTTP.

Resultado observado no Worker: isolamento cruzado retornou listas vazias/`404`; profissional sem privilégio recebeu `403`; senha direta institucional recebeu `422`; convite consumido novamente recebeu `404`; convite expirado recebeu `410`; token de reset reutilizado ou inválido recebeu `400`. O runner registra somente método, caminho redigido e status, sem tokens ou dados pessoais.

## Convites, recuperação e rate limiting

- Convites no Worker têm token aleatório, expiração e consumo atômico; o backend Python também consome token com filtro atômico.
- Login limita cinco falhas por e-mail durante 15 minutos.
- Recuperação possui resposta genérica, token de uma hora consumido atomicamente e, no Worker, throttle de cinco solicitações por 15 minutos.
- **Pendente:** não há rate limit geral para cadastro, criação de solicitações, feedback e endpoints administrativos; deve ser tratado antes de exposição ampla.

## Separação dos runtimes

### Backend Python

Os testes dinâmicos em memória executam diretamente os handlers FastAPI Python e cobrem isolamento de instituições, objetos de estudante/profissional, métricas e RBAC. O fluxo de convite/termos e o bloqueio de senha direta também foram exercitados por testes unitários dinâmicos.

### Worker Cloudflare

O Worker foi iniciado localmente com Wrangler e nunca foi publicado. O teste autenticado executou o fluxo HTTP real contra o gateway persistente sintético descrito acima. Em uma segunda execução sem os documentos legais obrigatórios, `GET /api` respondeu `200` com `pilot_enabled=false`, login autenticado respondeu `200` e mutação protegida respondeu `503`, confirmando o bloqueio também para usuários autenticados. O Worker foi testado separadamente do backend Python; nenhum dado foi enviado ao Atlas ou à produção.

## Classificação dos 17 testes legados ignorados

Os 17 casos de `backend/tests/test_acolhe_audit.py` foram coletados no Python 3.12 e ficaram `skipped` porque exigem URL e credenciais de integração. A classificação é:

- **Cobertos por testes sintéticos equivalentes:** isolamento de métricas, RBAC básico, convite inválido/expirado, consumo único de convite/reset, fluxo básico de solicitação e acesso por instituição.
- **Redundantes para esta fase:** verificações de saúde, autenticação básica e respostas genéricas já cobertas pelas suítes Python e Worker.
- **Ainda não executados e relevantes:** corrida de aceite atômico/concurrente, corrida de dois estudantes para o mesmo horário, cancelamento concorrente, cenários negativos completos de consentimento, proteção de link de sala e rate limiting HTTP sob carga. Esses casos permanecem pendentes por não haver um MongoDB de teste real/runner de concorrência configurado.

## Verificações operacionais adicionais

O runner `cloudflare-worker/scripts/phase2-worker-operational.mjs` executou **20 asserções HTTP** em Wrangler local, com dados sintéticos e gateway persistente. O gateway foi ajustado para serializar mutações e retornar a mesma semântica de `modifiedCount`/`findOneAndUpdate` esperada do MongoDB; isso permite testar os filtros atômicos usados pelo Worker, mas não substitui um servidor MongoDB real.

- **Reserva concorrente:** duas requisições para o mesmo horário produziram exatamente um `201` e um `409`.
- **Aceite concorrente:** duas requisições para o mesmo convite produziram exatamente um `200` e um `404`.
- **Cancelamento concorrente:** exatamente um `200` e um `409`; a transição é protegida pelo filtro de status.
- **Links de sala:** pré-aceite `409`, profissional de outra instituição `404`, acesso não autenticado `401`, link disponível somente no registro próprio após aceite, e alteração após conclusão `409`. Não foi observado vazamento para outro estudante.
- **Consentimentos negativos:** cadastro sem termos ou sem responsável de menor `422`; aceite de convite sem política `422`.
- **Rate limiting:** após cinco falhas de login, a sexta tentativa retornou `429`.

O ambiente não possui `mongod`, Docker ou WSL instalado. Portanto, não foi possível comprovar com o servidor MongoDB a atomicidade sob concorrência real nem executar carga distribuída. Esses cenários permanecem risco residual operacional, apesar de os filtros atômicos e os testes locais terem passado.

## Estado operacional

- `pilot_enabled=false` preservado; nenhum deploy foi executado.
- Branch separada; alterações reversíveis e não publicadas.
- Nenhum segredo, conta ou dado real foi usado.
- O ambiente de teste foi encerrado após a execução; os arquivos de persistência locais são artefatos sintéticos e não fazem parte do deploy.
