# Lacunas de privacidade por design

## Atendido parcialmente

- Minimização: não há prontuário ou mídia; respostas administrativas omitem `reason_note`, campos livres continuam limitados e o mapa de tratamentos foi documentado.
- Transparência: há páginas públicas, ainda identificadas como preliminares.
- Aceites: termos, privacidade, consentimento e versão são gravados separadamente.
- Direitos: exportação, correção e pedido de exclusão autenticados; fila administrativa existe.
- Segregação: rotas usam papel e instituição, mas o escopo institucional precisa revisão.

## Ausente ou dependente de decisão

- controlador, operadores e encarregado;
- bases legais por finalidade;
- prazo de retenção e expurgo;
- processo para responsáveis de menores;
- comprovação e revisão de CRP;
- canal e SLA para titulares/incidentes;
- avaliação de impacto e plano de resposta a incidentes;
- análise contratual/transferência internacional de Cloudflare, MongoDB e e-mail;
- documentação de backup/restauração;
- política aprovada e histórico de versões publicadas.

Controles técnicos adicionados na Fase 3: bloqueio operacional de profissionais sem CRP verificado, rate limiting de borda para endpoints sensíveis e CSP/headers também nos assets. Esses controles não resolvem as decisões jurídicas e operacionais listadas acima.

O gate de produção permanece necessário até os itens dependentes de decisão serem aprovados.
