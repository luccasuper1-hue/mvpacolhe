# Auditoria Acolhe — arquitetura observada

Status: diagnóstico técnico inicial; não é parecer jurídico.

## Topologia

- Frontend React/Vite em `frontend/src`, publicado como assets do Cloudflare Worker.
- API no Worker em `cloudflare-worker/src/index.ts` e `routes.ts`.
- Persistência MongoDB Atlas via `cloudflare-worker/src/db.ts` e `MONGO_URL`.
- Autenticação JWT em cookie `HttpOnly; Secure; SameSite=Lax` (`auth.ts`, `core.ts`).
- Papéis: `student`, `professional`, `institution`, `admin`.
- Durable Object `MONGO_GATEWAY` aparece em `wrangler.jsonc`; a implementação de dados usa o cliente MongoDB.
- Integração de e-mail é opcional por webhook HTTPS para convites e recuperação de senha.

## Entradas principais

- `POST /api/auth/register`, `/login`, `/logout`, `/invite/*`, `/forgot-password`, `/reset-password`.
- Rotas autenticadas de estudante em `studentRoutes`.
- Rotas autenticadas de profissional em `professionalRoutes`.
- Rotas autenticadas de instituição em `institutionRoutes`.
- Rotas administrativas em `adminRoutes`.

## Fluxos de confiança

1. Browser → Worker/Assets.
2. Worker valida origem/CORS, cookie/JWT e papel.
3. Worker lê/grava MongoDB Atlas.
4. Opcionalmente Worker envia somente dados de convite/reset ao webhook de e-mail.

Não há frontend autorizado a acessar MongoDB diretamente.
