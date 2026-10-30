# Achados de segurança — fase 1

Severidades: P0 crítico, P1 alto, P2 médio, P3 baixo.

## Achados confirmados

### P1 — Rate limiting de API incompleto

`cloudflare-worker/src/routes.ts` limita tentativas de login e recuperação por e-mail, mas não há limitador geral para cadastro, convites, solicitações, feedback ou endpoints administrativos. Isso permite abuso, enumeração operacional e aumento de custo.

### P1 — Verificação de CRP é apenas declaratória

`institutionRoutes` grava `crp_registration` com `crp_verified: false`, mas não há fluxo administrativo para verificar, aprovar ou bloquear o profissional antes de uso real.

### P1 — Fluxo de menor registra responsável sem verificação de vínculo

O cadastro exige nome/e-mail/aceite do responsável, mas não comprova identidade, autoridade parental ou confirmação independente. É um registro declaratório, não uma verificação.

### P1 — Admin podia criar instituição com senha direta sem aceite específico (corrigido na Fase 2)

O fluxo agora rejeita senha direta e sempre cria conta pendente por convite, com aceite de termos antes da ativação. Ver `phase2-findings.md`.

### P1 — Política de retenção e expurgo não implementada

Não foram encontrados jobs de expurgo, TTL indexes ou prazos configuráveis para usuários, solicitações, eventos, tokens e pedidos de direitos.

### P2 — Campos livres podem receber dados de saúde

`reason_note`, `referrals.note` e `feedback.comment` têm apenas limite de tamanho, sem classificação, bloqueio ou revisão para dados clínicos.

### P2 — CSP não evidenciada no Worker

`index.ts` define CORS e no-cache para API, mas não foi encontrado conjunto explícito de headers CSP, HSTS, frame-ancestors e X-Content-Type-Options para assets.

### P2 — Convite público revela dados pessoais mínimos

`GET /api/auth/invite/:token` revela nome, e-mail, papel e instituição para quem possuir o token. O token expira, mas não há revogação explícita além do uso/expiração.

### P2 — Compartilhamento administrativo de dados de estudantes

`GET /api/institutions/me/students` retorna nome, status, último acesso e contagem de solicitações; esse acesso precisa de decisão institucional e justificativa de necessidade.

## Controles positivos verificados

- Cookie de sessão HttpOnly/Secure/SameSite=Lax.
- Hash de senha com bcrypt.
- Checagem de papel antes de rotas protegidas.
- Filtros por `institution_id`, `student_id` ou `professional_id` em rotas principais.
- Cookies não armazenados em `localStorage`.
- Aceites separados e versionados no cadastro/convite.
- Gate `pilot_enabled` bloqueia uso real sem configuração jurídica aprovada.
- Testes locais de TypeScript e build passam.
