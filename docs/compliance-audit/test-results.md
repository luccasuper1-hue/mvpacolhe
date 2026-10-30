# Resultados da auditoria inicial

Data: 2026-10-30.

## Passaram

- `npm run check` no Worker: passou.
- `npm --prefix ../frontend run build`: passou; apenas aviso de bundle grande.
- `wrangler deploy --dry-run`: passou em validação anterior, com aviso não bloqueante de log local EPERM.
- API ao vivo `/api`: respondeu `status=ok`, `runtime=cloudflare-worker` e `pilot_enabled=false`.
- Cadastro ao vivo exibe opções separadas de adulto/menor e aceite de responsável condicional.
- Teste HTTP sintético de cadastro sem gate jurídico: retornou `503`, sem criar conta.

## Ainda não executados

- suíte automatizada de autorização por papel/instituição;
- testes de IDOR/BOLA em ambiente isolado;
- testes de rate limiting;
- teste E2E de responsável e convite de profissional;
- auditoria de dependências completa do monorepo;
- teste de restauração/backup.

## Suíte Python legada

`pytest -q` na raiz falha na coleta sem `PYTHONPATH=backend` (`ModuleNotFoundError: app`). Com `PYTHONPATH=backend`, os testes são marcados como `skipped` porque exigem URL e credenciais de integração não fornecidas; não foram executados contra produção.

Nenhum teste destrutivo ou alteração em dados reais foi executado.

## Fase 2

- `npm run check` no Worker: passou após as correções de autorização.
- `npm run build` no frontend: passou; permanece apenas aviso de bundle grande.
- `python -m compileall -q backend/app backend/tests`: passou.
- Testes unitários Python de autorização/convite foram adicionados e coletados com sucesso.
- A execução dos testes assíncronos Python não completou neste ambiente Windows/Python 3.13: `asyncio.run` bloqueia ao criar o event loop Proactor. Não há MongoDB isolado nem credenciais sintéticas de integração disponíveis. Nenhum teste foi executado contra produção.
- O caso mínimo confirmou que o bloqueio era do sandbox ao criar o socketpair do event loop Windows, não uma incompatibilidade intrínseca do código. Um ambiente Python 3.12 isolado (`.venv312`, não versionado) foi criado e executado fora do sandbox.
- `backend/tests/test_phase2_authorization.py`, `backend/tests/test_phase2_dynamic_isolation.py` e `backend/tests/test_auth_token_security.py`: **10 passed** no Python 3.12 isolado.
- `backend/tests/test_acolhe_audit.py`: **17 skipped**, pois não recebeu endpoint nem credenciais sintéticas de integração.
- Worker local via Wrangler (sem deploy): `/api` **200** com `pilot_enabled=false`; cadastro **503**; endpoints protegidos sem autenticação **401**. O acesso a dados autenticado do Worker não foi executado por falta de gateway MongoDB local.
