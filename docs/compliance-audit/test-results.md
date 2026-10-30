# Resultados da Fase 2 — autorização e isolamento

Data: 2026-10-30  
Branch: `audit/phase2-authz-isolation`  
Escopo: somente ambiente local isolado; nenhum deploy e nenhum dado real.

## Backend Python

Com Python 3.12 em `.venv312` e `PYTHONPATH=backend`:

```text
11 passed in 0.69s
```

Suítes executadas: `test_phase2_authorization.py`, `test_phase2_dynamic_isolation.py` e `test_auth_token_security.py`. O caso mínimo do travamento do event loop foi reproduzido no sandbox Windows; fora dele, Python 3.12 executou normalmente. A causa foi a criação de socketpair bloqueada pelo sandbox, não incompatibilidade do código.

## Worker Cloudflare

Wrangler executou o Worker local em `127.0.0.1:8798`. Um gateway HTTP local persistente em `127.0.0.1:8799` armazenou documentos sintéticos em arquivo JSON e implementou o contrato de operações do gateway Mongo usado pelo Worker.

- `phase2-worker-dynamic.mjs`: **36 asserções aprovadas**.
- Contas sintéticas: duas instituições, dois estudantes, dois profissionais, um administrador e um convite expirado.
- Cobertura: autenticação real, isolamento de perfis/listas, solicitações, sessões, encaminhamento, feedback, métricas, convites, reset, tokens expirados/reutilizados, RBAC e tentativa de senha direta institucional.
- Códigos relevantes: `403` para convite sem privilégio, `422` para senha direta, `404` para objeto de outra instituição e token de convite consumido, `410` para convite expirado, `400` para reset inválido/reutilizado.
- `phase2-worker-pilot-disabled.mjs`: `/api` `200` com `pilot_enabled=false`, login `200`, mutação autenticada protegida `503`.

O runner imprime apenas método, caminho redigido e status; tokens, senhas e dados pessoais não são registrados.

## Validações de build

- `npm run check` no Worker: passou.
- `node scripts/phase2-static-check.mjs`: passou.
- `npm run build` no frontend: passou; somente aviso não bloqueante de bundle grande.
- `npx wrangler deploy --dry-run`: passou; não realizou upload/deploy. Aviso não bloqueante de `whatwg-url`.

## 17 testes legados ignorados

`backend/tests/test_acolhe_audit.py` coletou **17 skipped** por ausência deliberada de URL/credenciais sintéticas. Os cenários equivalentes de isolamento, RBAC, convite e reset foram cobertos pelas suítes acima. Permanecem pendentes os testes de concorrência (aceite/cancelamento/duplo agendamento), negativos completos de consentimento, guard de link de sala e rate limiting HTTP sob carga; não foram executados contra produção.

## Decisão

Os testes críticos de autorização e isolamento no backend Python e no Worker local passaram. A Fase 2 permanece **bloqueada para aprovação final**, pois os cenários legados de concorrência, rate limiting e guard de sala ainda não têm execução dinâmica equivalente. Nenhum risco foi mascarado por deploy ou por dados de produção.
