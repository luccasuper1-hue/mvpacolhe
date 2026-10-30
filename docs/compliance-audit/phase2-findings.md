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

**Limitação:** não foi possível executar testes HTTP multiusuário contra um MongoDB/Worker isolado neste ambiente. A suíte de integração exige URL e credenciais sintéticas não fornecidas; nenhum teste foi apontado para produção.

## Convites, recuperação e rate limiting

- Convites no Worker têm token aleatório, expiração e consumo atômico; o backend Python também consome token com filtro atômico.
- Login limita cinco falhas por e-mail durante 15 minutos.
- Recuperação possui resposta genérica, token de uma hora consumido atomicamente e, no Worker, throttle de cinco solicitações por 15 minutos.
- **Pendente:** não há rate limit geral para cadastro, criação de solicitações, feedback e endpoints administrativos; deve ser tratado antes de exposição ampla.

## Estado operacional

- `pilot_enabled=false` preservado; nenhum deploy foi executado.
- Branch separada; alterações reversíveis e não publicadas.
- Nenhum segredo, conta ou dado real foi usado.
