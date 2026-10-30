# Fase 3 — riscos ainda não resolvidos

Este relatório é técnico e não declara conformidade LGPD, segurança total ou aptidão para atendimento real.

## Riscos aceitos provisoriamente

- CRP ainda depende de verificação operacional humana; o código apenas bloqueia quando `crp_verified` não é verdadeiro.
- Rate limiting de borda usa memória do Worker; não há garantia entre instâncias. Login/reset também usam registros persistentes.
- Notas e comentários livres podem conter dados sensíveis apesar dos limites de tamanho.
- Links de sala aceitam URLs HTTPS arbitrárias; lista de provedores permitidos ainda depende de decisão.
- Retenção e expurgo geral ainda não estão automatizados.

## Bloqueios para operação real

- controlador, operadores, contratos e transferências internacionais;
- bases legais e regras de menores/responsáveis;
- prazos de retenção, exceções, backup e restauração;
- processo de incidentes e canal de titulares;
- provedor de e-mail e tratamento de tokens fora do Worker;
- confirmação em MongoDB real e concorrência distribuída;
- revisão humana das minutas e ativação formal do piloto.
