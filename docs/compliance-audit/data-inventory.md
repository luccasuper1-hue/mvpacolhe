# Inventário técnico de dados

Status: inventário baseado no código atual; confirmar com operação antes de publicar.

## Coleções e campos

| Coleção | Campos observados | Origem/finalidade |
|---|---|---|
| `users` | id, name, email, password_hash, role, institution_id, active, age_band, guardian_name, guardian_email, guardian_consent_at, consent_accepted_at, terms_accepted_at, privacy_accepted_at, role_terms_accepted_at, legal_version, invite_token/expires, created_at | conta, vínculo, acesso e aceites |
| `students` | id, user_id, institution_id, created_at, last_access | vínculo e uso |
| `professionals` | id, user_id, institution_id, link_type, specialty, crp_registration, crp_verified, created_at, last_access | vínculo profissional e agenda |
| `institutions` | id, name, code, contact_email, plan, support_note, created_at | organização do piloto |
| `availability` | id, professional_id, institution_id, date, time, status, created_at | agenda |
| `requests` | id, student_id, professional_id, institution_id, availability_id, date, time, reason_code, reason_note, status, room_link, created_at | solicitação de conversa |
| `sessions` | id, request_id, student_id, professional_id, institution_id, date, time, status, created_at, completed_at | acompanhamento operacional |
| `referrals` | id, session_id, institution_id, status, note, created_at | encaminhamento |
| `feedback` | id, session_id, student_id, institution_id, score, comment, created_at | avaliação |
| `events` | id, type, user_id, role, institution_id, meta, created_at | auditoria operacional |
| `rights_requests` | id, user_id, institution_id, type, status, resolution_note, resolved_at, resolved_by, created_at | direitos do titular |
| `login_attempts` | identifier, count, locked_until, updated_at | proteção contra tentativas |
| `password_reset_tokens` | id, user_id, token, expires_at, used, created_at | recuperação de conta |

MongoDB também mantém o `_id` interno.

## Compartilhamento por papel

- Estudante: próprios dados, instituição, profissionais ativos e seus próprios registros de solicitações/sessões.
- Profissional: próprio perfil, agenda, solicitações destinadas a ele, textos de motivo, sessões e encaminhamentos vinculados.
- Instituição: nomes/status/último acesso/contagem de solicitações dos estudantes; dados cadastrais dos profissionais; métricas agregadas. Não recebe `reason_note` no endpoint administrativo.
- Admin: lista operacional ampla, solicitações sem `reason_note`, métricas globais e fila de direitos.
- MongoDB Atlas: recebe todos os documentos persistidos.
- Webhook de e-mail, se configurado: destinatário, nome, instituição, link/token de convite ou recuperação e papel.

## Dados não coletados pelo código do app

Não há persistência própria de IP, GPS, áudio, vídeo, prontuário, diagnóstico, documento de identidade ou biometria. Campos livres podem receber dados sensíveis por iniciativa do usuário.
