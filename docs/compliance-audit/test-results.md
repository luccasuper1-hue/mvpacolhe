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
