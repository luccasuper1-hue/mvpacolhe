# Acolhe — revisão técnica de prontidão LGPD

> Documento técnico de preparação. Não é parecer jurídico nem substitui a validação por advogado, encarregado de dados e profissional de Psicologia.

## Escopo observado

O piloto atual usa Cloudflare Workers/Assets, MongoDB Atlas e autenticação por cookie HttpOnly. O backend armazena contas, vínculos institucionais, disponibilidade, solicitações, sessões, encaminhamentos, feedback, tokens temporários e eventos operacionais. Alguns campos livres (`reason_note`, comentários e notas de encaminhamento) podem receber informação de saúde se o usuário ignorar as orientações da interface.

## Achados prioritários

| Prioridade | Achado | Estado |
| --- | --- | --- |
| Crítica | Textos públicos diziam que nenhum dado era armazenado, embora o piloto grave dados pessoais e operacionais no backend. | Corrigido tecnicamente nesta revisão; o texto ainda precisa de aprovação jurídica. |
| Alta | O frontend duplicava o JWT em `localStorage`, aumentando o impacto de XSS. | Removido; a sessão web usa o cookie `HttpOnly` emitido pelo Worker. |
| Alta | Não há fluxo de acesso, correção, eliminação, portabilidade ou revogação de consentimento para titulares. | Pendente de desenho operacional e implementação. |
| Alta | O cadastro possui apenas um checkbox do próprio usuário; não verifica idade nem consentimento/participação de responsável. | Pendente; bloquear uso real de menores até definir o processo. |
| Alta | Não há política de retenção, descarte, backup/restauração ou resposta a incidentes documentada. | Pendente. |
| Alta | A política pública não identifica claramente controlador, operador, compartilhamentos, finalidades, bases legais e canal do encarregado. | Pendente de decisão jurídica/operacional. |
| Média | Cookie usa `SameSite=None` para permitir backend separado, mas não existe proteção CSRF explícita para mutações autenticadas. | Pendente; manter o backend separado desativado até revisar a arquitetura. |
| Média | Não há CSP no frontend estático. | Pendente; precisa ser configurada após confirmar fontes e integrações permitidas. |
| Média | MongoDB Atlas, Cloudflare e eventual provedor de e-mail não estão descritos como operadores/compartilhamentos. | Pendente de inventário contratual e transferência internacional. |

## Requisitos a fechar antes de uso real

1. Definir controlador(es), operador(es), encarregado e canal de atendimento.
2. Fazer inventário de dados por campo, finalidade, base legal, acesso, retenção e descarte.
3. Decidir o modelo para crianças e adolescentes: faixa etária, melhor interesse, responsável, comprovação e fluxo de revogação.
4. Restringir campos livres ou aplicar aviso/validação para impedir relatos clínicos desnecessários.
5. Implementar direitos do titular com autenticação, protocolo e prazo operacional.
6. Definir segregação institucional, acesso mínimo e auditoria de leitura/modificação.
7. Documentar incidentes, backup, restauração, eliminação e resposta a solicitações oficiais.
8. Revisar o fluxo com advogado, encarregado e psicólogo responsável antes de qualquer piloto com pessoas reais.

## Referências oficiais

- LGPD (Lei nº 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD — direitos dos titulares: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares
- ANPD — crianças e adolescentes: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes
- CFP — orientação e sigilo profissional: https://site.cfp.org.br/servicos/orientacao-e-etica/duvidas-frequentes-de-orientacao-e-etica/

