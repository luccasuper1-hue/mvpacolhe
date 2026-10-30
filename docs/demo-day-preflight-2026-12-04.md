# Preflight de publicação — Demo Day 04/12/2026

## Decisão atual

**NO-GO para publicar agora.** O `wrangler.jsonc` principal aponta para o Worker existente `acolhemvp2`, associado anteriormente ao endereço `acolhemvp2.luccasuper1.workers.dev`. Publicar esse arquivo poderia substituir o serviço já existente. A separação necessária ainda não foi criada no Cloudflare.

## Destino seguro proposto

Usar um Worker independente chamado `acolhemvp2-demo-20261204` (endereço esperado, após criação no mesmo subdomínio da conta: `acolhemvp2-demo-20261204.luccasuper1.workers.dev`). A configuração local está em `cloudflare-worker/wrangler.rc-demo.jsonc` e não altera Cloudflare por si só.

Esse Worker deve ter:

- Durable Object/banco de demonstração separado;
- projeto/base MongoDB exclusivamente sintético;
- secrets criados especificamente para a demonstração;
- nenhuma referência ao Worker `acolhemvp2` existente;
- `TEST_MODE` ausente;
- `PILOT_LEGAL_VERSION`, `PILOT_CONTROLLER_NAME` e `PILOT_PRIVACY_EMAIL` ausentes, mantendo `pilot_enabled=false`.

## Banco de dados

O código usa `MONGO_URL` e `DB_NAME` fornecidos externamente. O repositório não contém URI real. Para publicar, o banco deve ser um cluster/projeto de homologação separado, recém-criado ou vazio, com apenas fixtures sintéticas. Não há garantia aceitável enquanto a URI e o projeto do Atlas não forem verificados manualmente.

## Variáveis necessárias

Secrets/variáveis, sem revelar valores:

- `MONGO_URL` — Secret; URI do MongoDB sintético.
- `DB_NAME` — nome do banco de demonstração.
- `JWT_SECRET` — Secret aleatório com pelo menos 32 caracteres.
- `FRONTEND_URL` — origem pública exata do Worker demo.
- `APP_ENV=demo`.
- `ROOM_LINK_ALLOWED_HOSTS=meet.example.test` apenas se o roteiro mostrar validação sintética de link.

Devem permanecer ausentes: `TEST_MODE`, `TEST_SEED_SECRET`, `TEST_GATEWAY_URL`, `PILOT_RETURN_RESET_TOKEN`, `PILOT_LEGAL_VERSION`, `PILOT_CONTROLLER_NAME` e `PILOT_PRIVACY_EMAIL`.

Integrações de e-mail (`INVITE_EMAIL_WEBHOOK_*`, `RESET_EMAIL_WEBHOOK_*`) devem permanecer desabilitadas para a demonstração, salvo aprovação explícita e endpoint de teste sem destinatários reais.

## Fluxo demonstrativo

O fluxo usa a experiência demonstrativa já embutida no frontend (`student.demo`/`professional.demo`) e dados estáticos. Ele não cria usuários no banco, não emite tokens reais e não altera `pilot_enabled`. As rotas de operação real continuam sujeitas às mesmas gates de autenticação, CRP e consentimento; não existe bypass.

## Procedimento futuro

1. Aprovar a criação do Worker independente e do banco sintético.
2. Configurar secrets/variáveis no serviço novo, sem copiar valores do Worker existente.
3. Executar build, TypeScript, static checks e `wrangler deploy --dry-run` com `wrangler.rc-demo.jsonc`.
4. Publicar manualmente e testar `/api`, CSP, `boot.js`, login demonstrativo, navegação, filtros e bloqueio de operação real.
5. Monitorar somente métricas/logs redigidos do Worker demo.
6. Em falha, desativar o Worker demo ou voltar ao deployment anterior desse Worker, sem tocar `acolhemvp2`.

## Recursos potencialmente afetados

Se o Worker existente `acolhemvp2` for usado, podem ser afetados: URL pública atual, assets frontend, Durable Object `MongoGateway`, banco apontado por `MONGO_URL`, sessões JWT, rate-limit em memória e integrações de e-mail configuradas. Por isso a publicação no destino atual está bloqueada.

