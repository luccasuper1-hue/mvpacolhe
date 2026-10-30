# Acolhe — Release Candidate Demo Day (04/12/2026)

## Origem e congelamento

- Branch: `release/demo-day-2026-12-04`
- SHA de origem validado: `f8a90e4700d93b11a27ffe2265aa85c42b9260e2`
- Escopo congelado: somente correções demonstráveis, ajustes de apresentação e documentação. Sem novas funcionalidades não essenciais.
- Nenhum deploy, serviço pago, dado real ou credencial real foi utilizado.

## Contas sintéticas

O fixture está em `cloudflare-worker/scripts/demo-day-fixture.json`. Os e-mails usam `example.test` e os valores de senha são marcadores documentais, não credenciais publicáveis. No fluxo demonstrativo do frontend, usar exclusivamente as contas já embutidas como `student.demo` e `professional.demo`.

## Roteiro reproduzível

1. Abrir a URL da versão candidata somente após aprovação de publicação.
2. Confirmar que a página informa protótipo/demonstração e que não há atendimento real.
3. Navegar para login demonstrativo, escolher Estudante e concluir o acesso sintético.
4. Percorrer onboarding, escolha de assunto, seleção de profissional e filtros.
5. Voltar ao início e abrir “Como funciona”, “Ajuda”, “Privacidade” e “Termos”.
6. Demonstrar a área profissional com dados fictícios, sem criar sessão real.
7. Mostrar que o modo real permanece bloqueado enquanto `pilot_enabled=false`.
8. Não inserir e-mail, nome, CRP, link de sala ou relato de pessoa real.

## Evidências locais

- Worker autorização/isolamento: 41 asserções.
- Worker operacional: 30 asserções.
- Frontend smoke: home, login, login demonstrativo, onboarding, assunto, profissionais e filtros.
- Build frontend, TypeScript, static checks e Wrangler dry-run aprovados.
- Ausência de allowlist e allowlist malformada devem retornar `422`; somente configuração explícita de `meet.example.test` permite o link sintético.

## Critérios de aceite da demonstração

- Build limpo e static checks aprovados.
- Smoke script reproduzível sem dados reais.
- `pilot_enabled=false` confirmado antes da apresentação.
- Nenhum segredo real em variáveis, fixture ou roteiro.
- Rollback preparado para o SHA de origem.

