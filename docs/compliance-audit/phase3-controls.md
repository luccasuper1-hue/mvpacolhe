# Fase 3 — controles concluídos e limites da auditoria

## Controles técnicos concluídos

- `crp_verified` só é consumido como gate nas rotas profissionais; a mutação agora existe apenas em `POST /api/admin/professionals/:id/crp-verification`, exige papel `admin`, valida `verified`/`source` e grava `crp_verified_at`, `crp_verified_by`, `crp_verification_source` e evento de auditoria. Testes sintéticos: profissional e instituição recebem `403`; administrador recebe `200` e os campos de rastreabilidade.
- `pilot_enabled` não é um campo mutável da base nem entrada aceita por rotas. É derivado exclusivamente das variáveis de configuração do Worker (`PILOT_LEGAL_VERSION`, `PILOT_CONTROLLER_NAME`, `PILOT_PRIVACY_EMAIL`); payloads de criação institucional não alteram essa derivação. A habilitação real continua dependente de decisão operacional fora do usuário autenticado.
- Links de sala usam allowlist configurável (`ROOM_LINK_ALLOWED_HOSTS`), HTTPS obrigatório, sem userinfo/fragments e com rejeição de hosts look-alike. Worker e backend aplicam a mesma regra.
- CSP e headers foram mantidos e o script de inicialização passou a ser externo; o teste dinâmico confirmou `boot.js` com `200` e CSP presente.
- Suítes Worker locais: 30 asserções operacionais e 41 asserções de autorização/isolamento passaram, incluindo concorrência, tokens, CRP, links maliciosos e rate limit.

## Riscos técnicos ainda pendentes

- O rate limit de borda em memória é por instância; a estratégia distribuída está documentada, mas requer escolha de WAF/Durable Object/serviço externo.
- Não foi possível executar homologação com MongoDB real neste ambiente; o gateway JSON serializa mutações, mas não prova atomicidade distribuída do Atlas.
- Redirecionamentos posteriores de um provedor de sala não são verificáveis pelo servidor.
- Campos livres continuam aceitos com limites de tamanho; minimização semântica e retenção dependem de decisão da equipe.

## Decisões humanas necessárias

Escolher provedores/domínios de sala; aprovar arquitetura e orçamento de rate limiting distribuído; definir processo e autoridade de verificação CRP; aprovar textos/versões legais, bases, prazos, menores, responsáveis, controlador/operadores e critérios de ativação do piloto.

## Demonstração segura

Usar somente fixtures sintéticas, `pilot_enabled=false`, Worker local ou ambiente de teste separado, domínio de sala de teste e sem convites/e-mails reais. O gateway JSON não deve ser apresentado como validação de MongoDB de produção.

## Futuro piloto real

Exige MongoDB isolado homologado, observabilidade e rate limiting distribuídos, provedor de sala aprovado, revisão humana dos documentos e fluxos de menores, gestão de direitos/retention, credenciais reais segregadas e plano de resposta a incidentes. Esta auditoria não declara conformidade LGPD nem aptidão para atendimentos reais.

