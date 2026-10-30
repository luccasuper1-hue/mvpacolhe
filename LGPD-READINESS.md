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
| Alta | O titular não tinha uma forma técnica de consultar os dados da própria conta nem registrar um pedido de eliminação. | Parcialmente corrigido: `GET /api/auth/me/export` e `POST /api/auth/me/deletion-request` autenticados; ainda falta operação humana, correção, portabilidade e decisão de retenção. |
| Alta | O cadastro precisa documentar exatamente quais documentos foram aceitos; não verifica idade nem consentimento/participação de responsável. | Parcialmente corrigido: termos e política agora têm aceites separados e versionados; convites de profissionais e instituições exigem termo específico; cadastro de menores é bloqueado até existir fluxo aprovado com responsável e instituição. |
| Alta | Não há política de retenção, descarte, backup/restauração ou resposta a incidentes documentada. | Pendente; pedidos de direitos agora têm fila administrativa, mas a execução e os prazos ainda são operacionais. |
| Alta | A política pública não identifica claramente controlador, operador, compartilhamentos, finalidades, bases legais e canal do encarregado. | Pendente de decisão jurídica/operacional; não inventar nomes, e-mails ou bases legais no produto. |
| Alta | Sessões por cookie precisam impedir mutações disparadas por origem externa. | Corrigido nesta revisão: cookie `SameSite=Lax` no deploy unificado e validação de `Origin` para mutações autenticadas. |
| Média | Respostas de login/registro ainda poderiam devolver o JWT ao JavaScript mesmo usando cookie. | Corrigido nesta revisão: o token fica apenas no cookie HttpOnly; a resposta não o expõe ao frontend. |
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
9. Configurar `PILOT_LEGAL_VERSION`, `PILOT_CONTROLLER_NAME` e `PILOT_PRIVACY_EMAIL` com os dados aprovados pela operação; não usar os valores padrão de rascunho em produção.
10. Verificar o CRP informado por cada profissional antes de ativar sua conta; o campo técnico é apenas um registro da verificação, não uma validação automática.

## Fluxo técnico de direitos implementado

- `GET /api/auth/me/export`: devolve os dados da conta e os registros operacionais vinculados ao próprio titular, sem senha, token de convite ou token de recuperação.
- `POST /api/auth/me/correction`: permite corrigir nome e e-mail da própria conta, com validação de duplicidade e registro de auditoria.
- `POST /api/auth/me/deletion-request` com `{ "confirm": true }`: registra um pedido autenticado em `rights_requests` e retorna um protocolo. A exclusão não é automática: a operação precisa validar retenção, vínculos e eventuais obrigações antes de executar.
- Ainda faltam canal público, correção de dados, portabilidade em formato definido, prazos internos, responsável e tratamento de exceções.

## Estado do aceite no piloto

- O cadastro de estudante exige aceite separado dos termos e da política de privacidade e grava os horários e a versão apresentada.
- O aceite de convite de profissional usa o mesmo registro versionado.
- O painel administrativo possui uma fila autenticada de pedidos de direitos (`GET /api/admin/rights-requests`) e uma operação de resolução (`POST /api/admin/rights-requests/:id/resolve`). Essas rotas não executam eliminação automática, porque retenção e obrigações precisam ser avaliadas caso a caso.
- Convites de profissionais exigem aceite explícito de confidencialidade, sigilo profissional e não redistribuição; convites de instituições exigem termo específico de responsabilidade sobre acesso e proteção dos dados.
- O convite de profissional exige registro CRP informado pela instituição e marca o registro como não verificado até a conferência humana.

## Referências oficiais

- LGPD (Lei nº 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD — direitos dos titulares: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares
- ANPD — crianças e adolescentes: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes
- CFP — orientação e sigilo profissional: https://site.cfp.org.br/servicos/orientacao-e-etica/duvidas-frequentes-de-orientacao-e-etica/

## Gate de publicação

O endpoint `/api` informa `pilot_enabled`. Ele só fica `true` quando a operação configura, no ambiente de produção, `PILOT_LEGAL_VERSION`, `PILOT_CONTROLLER_NAME` e `PILOT_PRIVACY_EMAIL`. Sem esses valores, cadastro de estudante, aceite de convite profissional e novos convites retornam `503`; a experiência demonstrativa continua disponível.

Também são obrigatórias as variáveis de execução `DB_NAME=acolhe` e `FRONTEND_URL=https://acolhemvp2.luccasuper1.workers.dev`. Elas não são segredos e devem ser mantidas no ambiente de produção do Worker.

