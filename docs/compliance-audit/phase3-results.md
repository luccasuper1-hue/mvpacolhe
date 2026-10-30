# Fase 3 — resultados locais

Data: 2026-10-30. Nenhum deploy, piloto ou dado real foi utilizado.

## Implementado

- Mapa técnico de tratamentos, inferências e compartilhamentos.
- Proposta de retenção sem expurgo automático.
- Bloqueio de operações de profissionais sem `crp_verified=true` no Worker e no backend Python.
- Rate limiting de borda para cadastro, reset, aceite de convite, solicitações, feedback, direitos e mutações administrativas; login/reset persistentes permanecem ativos.
- CSP e headers de segurança em API e assets; scripts inline foram movidos para `public/boot.js`.
- Minutas jurídicas atualizadas apenas para refletir comportamento efetivo, com decisões marcadas como `PENDENTE`.

## Testes

- Python privacy/authz: **13 passed**.
- Python legado: **17 skipped**, sem URL/credenciais de integração.
- Worker operacional: **24 asserções aprovadas**.
- Worker autorização/isolamento/minimização: **37 asserções aprovadas**.
- Worker com piloto desabilitado: `GET /api` `200`, login `200`, mutação protegida `503`.
- TypeScript, static checks e frontend build: aprovados.
- Wrangler dry-run: aprovado sem deploy.

## Pendências e riscos

- Não há MongoDB real, Docker ou WSL nesta máquina; atomicidade distribuída e carga entre instâncias continuam sem comprovação.
- Rate limiting de borda é por instância; precisa de proteção distribuída do provedor antes de operação ampla.
- Verificação de CRP, regras de menores, base legal, controlador/operadores e retenção exigem decisão humana.
- Links externos de sala ainda aceitam qualquer URL HTTPS; lista de provedores permitidos é decisão pendente.
- Campos livres podem conter dados sensíveis se o usuário ignorar as orientações.

## Decisão da Fase 3

As correções técnicas locais são verificáveis e reversíveis, mas a fase não declara conformidade jurídica nem aptidão para atendimentos reais. A liberação do piloto continua bloqueada até as decisões humanas e os riscos operacionais listados em `phase3-open-risks.md` serem tratados.
