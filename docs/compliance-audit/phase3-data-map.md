# Fase 3 — Mapa de tratamentos e minimização

Documento técnico, não parecer jurídico. Todas as bases legais, papéis e prazos dependem de aprovação humana.

| Tratamento | Dados coletados/armazenados | Inferência possível | Acesso técnico atual | Minimização/risco |
|---|---|---|---|---|
| Conta e autenticação | nome, e-mail, hash de senha, papel, instituição, estado ativo | vínculo com uma instituição e participação no piloto | titular; admins em operação | não armazenar senha; e-mail aparece apenas onde necessário |
| Menor/responsável | faixa etária, nome/e-mail do responsável, aceite e data | usuário é menor e depende de responsável | titular e fluxos institucionais conforme código | não coletar documento/biometria; decisão sobre representação ainda pendente |
| Solicitação | motivo categórico, nota livre opcional, horário, vínculos | possível necessidade de apoio psicológico; a nota pode revelar saúde mental | estudante e profissional destinatário; admin sem `reason_note`; instituição recebe métricas | limitar texto e orientar a não inserir diagnóstico/terceiros |
| Sessão/encaminhamento | data, status, profissional, nota de encaminhamento | atendimento ocorreu e possível necessidade de encaminhamento | participantes; métricas agregadas para instituição/admin | restringir notas e evitar conteúdo clínico |
| Avaliação | nota e comentário livre | percepção de atendimento/satisfação | estudante e métricas agregadas | limitar comentário; não usar para diagnóstico |
| Profissional | CRP, especialidade, vínculo e verificação | habilitação profissional | instituição e operação | acesso operacional bloqueado até `crp_verified=true` |
| Segurança/direitos | eventos, tentativas, pedidos de titular | comportamento de acesso/uso | operação autorizada/admin | eventos não recebem notas livres ou tokens |
| Tokens/links | convite, reset e link de sala externo | capacidade de acessar conta/reunião | somente fluxo autorizado; tokens não devem ir para logs | expiração e consumo único; domínio de sala ainda pendente |

Compartilhamentos técnicos atuais: Worker/Cloudflare, MongoDB gateway/Atlas e webhook de e-mail quando configurado. Não há persistência própria de IP, áudio, vídeo, diagnóstico, prontuário, documento ou biometria. Campos livres continuam sendo o principal vetor de coleta incidental de dado sensível.
