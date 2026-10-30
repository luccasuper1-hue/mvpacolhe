# Links de sala e minimização de texto livre

## Política implementada

O backend e o Worker aceitam somente `https://` e hosts configurados em `ROOM_LINK_ALLOWED_HOSTS` (lista separada por vírgulas). Subdomínios são aceitos apenas quando pertencem ao host configurado; userinfo, fragmentos, HTTP e hosts enganosos são rejeitados. Com a variável ausente, nenhum link é aceito até que a operação escolha e configure um provedor.

A validação cobre o destino inicial. Ela não consegue garantir o comportamento de redirecionamentos posteriores do provedor; por isso o provedor e o domínio continuam sendo uma decisão operacional. A CSP não transforma navegação externa em canal confiável.

## Texto livre

`reason_note` (500), `referrals.note` (400), `feedback.comment` (400) e `support_note` (400) continuam opcionais/limitados para preservar os fluxos. A interface deve orientar a não inserir nomes, diagnósticos, contatos ou dados de terceiros. Redação automática, bloqueio semântico e prazos de retenção não foram implementados sem aprovação da equipe.

