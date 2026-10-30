# Achados de segurança — fase 1

Severidades: P0 crítico, P1 alto, P2 médio, P3 baixo.

## Achados confirmados

### P1 — Rate limiting de API incompleto

`cloudflare-worker/src/index.ts` agora aplica limite de borda por rota/IP para cadastro, reset, aceite de convite, solicitações, feedback, direitos e mutações administrativas; login/reset mantêm também controles persistentes. O limite de borda é por instância e não substitui proteção distribuída do provedor.

### P1 — Verificação de CRP é apenas declaratória

O Worker e o backend Python agora bloqueiam rotas operacionais de profissionais quando `crp_verified` não é estritamente verdadeiro. A verificação do registro, fonte e revalidação continuam pendentes de processo operacional humano.

### P1 — Fluxo de menor registra responsável sem verificação de vínculo

O cadastro exige nome/e-mail/aceite do responsável, mas não comprova identidade, autoridade parental ou confirmação independente. É um registro declaratório, não uma verificação.

### P1 — Admin podia criar instituição com senha direta sem aceite específico (corrigido na Fase 2)

O fluxo agora rejeita senha direta e sempre cria conta pendente por convite, com aceite de termos antes da ativação. Ver `phase2-findings.md`.

### P1 — Política de retenção e expurgo não implementada

Não foram encontrados jobs de expurgo, TTL indexes ou prazos configuráveis para usuários, solicitações, eventos, tokens e pedidos de direitos.

### P2 — Campos livres podem receber dados de saúde

`reason_note`, `referrals.note` e `feedback.comment` têm apenas limite de tamanho, sem classificação, bloqueio ou revisão para dados clínicos.

### P2 — CSP não evidenciada no Worker

API e assets agora recebem CSP, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` e `Cache-Control`. HSTS depende da configuração HTTPS/domínio final e não foi ativado localmente.

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
