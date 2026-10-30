# Matriz de riscos

| ID | Risco | Probabilidade | Impacto | Nível | Tratamento |
|---|---|---:|---:|---|---|
| R1 | Profissional não verificado atender | média | crítico | P1 | fluxo administrativo de verificação e bloqueio |
| R2 | Tratamento de dados de menor sem comprovação suficiente | média | crítico | P1 | definir responsável, evidência, melhor interesse e revogação |
| R3 | Abuso de endpoints sem rate limit | alta | alto | P1 | limites por IP/conta/rota e observabilidade |
| R4 | Retenção indefinida de dados e eventos | alta | alto | P1 | prazos aprovados, TTL/expurgo e registro de exceções |
| R5 | Texto livre conter dado clínico desnecessário | média | alto | P2 | minimizar campos, avisos e política de revisão |
| R6 | Instituição acessar dados além da necessidade | média | alto | P2 | revisar escopo e implementar projeções mínimas |
| R7 | Falta de CSP/headers de browser | média | médio | P2 | configurar headers compatíveis com assets |
| R8 | Convite/token ser compartilhado indevidamente | baixa | alto | P2 | token single-use, revogação e menor exposição |
| R9 | Falha de fornecedor/e-mail expor link | baixa | alto | P2 | contrato, webhook dedicado, expiração e logs redigidos |
| R10 | Decisões jurídicas não definidas | alta | crítico | P0 | manter gate de produção desligado |
