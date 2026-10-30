# Fase 3 — Privacidade por Design e Preparação para Operação

Status: iniciada em ambiente local, sem deploy e sem dados reais.

## Plano de implementação

1. **Inventário e classificação:** mapear contas, vínculos institucionais, solicitações, notas livres, sessões, encaminhamentos, avaliações, métricas, eventos, tokens e links externos; classificar dados identificadores, profissionais e potencialmente sensíveis/inferidos.
2. **Minimização e autorização:** revisar cada resposta por papel, retirar campos não necessários, manter isolamento institucional e registrar acessos/exportações sem conteúdo clínico.
3. **Barreira profissional:** impedir agenda, solicitações, sessões, encaminhamentos e links de sala para profissionais sem `crp_verified=true`; separar verificação técnica de decisões da equipe sobre comprovação e manutenção do CRP.
4. **Menores e responsáveis:** manter validações técnicas existentes para faixa etária, responsável e consentimento; documentar como pendências jurídicas a base legal, representação, revogação e retenção.
5. **Retenção e expurgo:** propor matriz de prazos e exceções; não apagar dados automaticamente até aprovação humana. Depois da aprovação, implementar expurgo auditável e reversível por ambiente.
6. **Campos livres, logs e integrações:** limitar notas, evitar conteúdo clínico, redigir erros/logs, não incluir tokens em logs/URLs de observabilidade e revisar webhooks/e-mails/links externos.
7. **Rate limiting:** ampliar proteção além de login/reset para cadastro, convites, solicitações, feedback, exportação e direitos; usar limites conservadores e testes automatizados.
8. **Headers/CSP:** validar CSP, `frame-ancestors`, `referrer-policy`, `permissions-policy`, cache e CORS em API e assets.
9. **Documentos:** atualizar privacidade, termos, convite, menores e piloto com o comportamento efetivo do código, marcando decisões humanas.

## Bloqueios que exigem decisão da equipe

- Base legal e papel de controlador/operador de cada instituição.
- Prazos de retenção por tipo de dado e exceções legais/auditoria.
- Procedimento e evidências aceitas para `crp_verified` (e revalidação).
- Regras de responsável para menores, revogação e atendimento emergencial.
- Domínios de videoconferência permitidos e responsabilidade pelo provedor externo.
- Limites de rate limiting compatíveis com o piloto e canal de suporte para desbloqueio.
- Provedor de e-mail, residência dos dados, contratos e tratamento de incidentes.
- Conteúdo final e versões dos documentos jurídicos; código não substitui revisão profissional.

## Critério de saída

As correções técnicas locais serão aceitas somente com testes de regressão passando. A Fase 3 não declarará conformidade jurídica nem aptidão para atendimento real; riscos e decisões pendentes ficarão em relatório separado.
