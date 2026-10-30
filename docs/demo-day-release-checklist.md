# Checklist de publicação futura — Release Candidate Demo Day

## Antes da publicação (aprovação humana obrigatória)

- [ ] Aprovar o SHA e a branch candidata.
- [ ] Confirmar que a conta Cloudflare e o projeto escolhidos não contêm dados reais.
- [ ] Configurar somente variáveis sintéticas e `pilot_enabled=false`.
- [ ] Revisar domínio público, banner de demonstração e contatos de contingência.
- [ ] Confirmar que nenhum provedor pago ou integração de e-mail será acionado.

## Publicação controlada

- [ ] Executar build, TypeScript, static checks e smoke scripts.
- [ ] Fazer deploy manual com janela registrada.
- [ ] Verificar `/api`, CSP, headers, `boot.js` e rotas principais.
- [ ] Monitorar erros, latência e logs sem conteúdo de campos livres.

## Rollback

- [ ] Manter o SHA `f8a90e4700d93b11a27ffe2265aa85c42b9260e2` como referência.
- [ ] Reverter para a versão anterior pelo painel Cloudflare, sem alterar banco.
- [ ] Invalidar variáveis sintéticas e desligar o serviço se aparecer qualquer dado real.
- [ ] Registrar incidente e preservar evidências redigidas.

## Contingência Demo Day

- [ ] Ter vídeo/screenshots locais da demonstração.
- [ ] Ter fixture sintético e roteiro offline.
- [ ] Não tentar corrigir produção durante a apresentação.
- [ ] Se autenticação falhar, usar somente a experiência demonstrativa local e declarar a limitação.

