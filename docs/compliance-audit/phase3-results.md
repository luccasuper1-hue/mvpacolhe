# Fase 3 — resultados locais

Data: 2026-10-30. Nenhum deploy, piloto ou dado real foi utilizado.

## Implementado

- Mapa técnico de tratamentos, inferências e compartilhamentos.
- Proposta de retenção sem expurgo automático.
- Bloqueio de operações de profissionais sem `crp_verified=true` no Worker e no backend Python.
- Rota administrativa explícita para verificação/revogação de CRP, com fonte, horário, administrador e evento de auditoria.
- Allowlist configurável de links de sala (`ROOM_LINK_ALLOWED_HOSTS`) aplicada no Worker e no backend, com rejeição de HTTP, userinfo, fragments e hosts look-alike.
- Rate limiting de borda para cadastro, reset, aceite de convite, solicitações, feedback, direitos e mutações administrativas; login/reset persistentes permanecem ativos.
- CSP e headers de segurança em API e assets; scripts inline foram movidos para `public/boot.js`.
- Minutas jurídicas atualizadas apenas para refletir comportamento efetivo, com decisões marcadas como `PENDENTE`.

## Testes

- Python privacy/authz: **13 passed**.
- Pytest runner investigation: `pytest.serial.ini` and `--basetemp .pytest-serial` remove xdist parallelism and sandbox temp collisions; a minimal `asyncio.sleep(0)` still blocks before the first await on this managed Windows Python runtime, so test execution remains an environment limitation rather than an application failure.
- Python legado: **17 skipped**, sem URL/credenciais de integração.
- Worker operacional: **30 asserções aprovadas**.
- Worker autorização/isolamento/minimização: **41 asserções aprovadas**.
- Frontend preview smoke: home, navegação real de login, login demonstrativo, onboarding, seleção de assunto e filtros de profissionais percorridos com CSP do Worker validada separadamente.
- Frontend `npm test`: executado sem falhas; não há testes automatizados registrados nessa suíte (`0 tests`).
- Configuração fail-closed/rotas CRP: static checks aprovados.
- Worker com piloto desabilitado: `GET /api` `200`, login `200`, mutação protegida `503`.
- TypeScript, static checks e frontend build: aprovados.
- Wrangler dry-run: aprovado sem deploy.

## Pendências e riscos

- Não há MongoDB real, Docker ou WSL nesta máquina; atomicidade distribuída e carga entre instâncias continuam sem comprovação.
- Rate limiting de borda é por instância; precisa de proteção distribuída do provedor antes de operação ampla.
- Verificação de CRP, regras de menores, base legal, controlador/operadores e retenção exigem decisão humana.
- A lista de provedores/domínios de sala continua sendo decisão operacional; sem configuração, links são recusados.
- O caso dinâmico completo de allowlist ausente/malformada não foi executado nesta rodada porque exige um segundo processo Worker/fixture; a implementação e o check estático confirmam `allowed.length > 0` como pré-condição.
- Campos livres podem conter dados sensíveis se o usuário ignorar as orientações.

## Decisão da Fase 3

As correções técnicas locais são verificáveis e reversíveis, mas a fase não declara conformidade jurídica nem aptidão para atendimentos reais. A liberação do piloto continua bloqueada até as decisões humanas e os riscos operacionais listados em `phase3-open-risks.md` serem tratados.
