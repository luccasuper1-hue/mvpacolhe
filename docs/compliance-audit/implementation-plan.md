# Plano de implementação

## P0 — antes de liberar operação

1. Manter `pilot_enabled=false` até decisões humanas documentadas.
2. Criar testes de autorização negativos para cada papel e instituição.
3. Corrigir criação direta de conta institucional; exigir convite e aceite.

## P1 — segurança e privacidade

1. Rate limiting por rota/IP/conta.
2. Fluxo administrativo de verificar/revogar CRP.
3. Fluxo de responsável com registro de evidência e revisão.
4. Prazos de retenção aprovados e expurgo reversível/auditado.
5. Reduzir projeções administrativas e proteger campos livres.

## P2 — endurecimento

1. Headers CSP/HSTS/frame-ancestors/nosniff.
2. Revogação explícita de convites e recuperação.
3. Monitoramento, alertas e runbook de incidentes.
4. Inventário de fornecedores e contratos.

## Validação

Cada item deve ter teste automatizado, evidência no `test-results.md` e revisão antes de qualquer deploy. Não executar migração, expurgo ou ativação real automaticamente.
