# Fase 3 — rate limiting distribuído

O limite atualmente implementado no Worker é um bucket em memória por instância, separado por rota e IP. Ele protege bursts locais e retorna `429`, mas não é uma garantia global: reinícios, múltiplas instâncias e regiões podem permitir mais tentativas do que o limite nominal.

## Opções avaliadas

| Opção | Garantia | Custo/dependências | Limitação |
| --- | --- | --- | --- |
| Cloudflare WAF/Rate Limiting Rules | Enforcement na borda, sem estado da aplicação | Requer plano/feature compatível e configuração no painel | Limites por IP/rota; não substitui regras por usuário/token |
| Durable Object por chave | Serialização forte por chave e contador consistente | Binding, código de objeto, observabilidade e cobrança por requests/duração | Mais complexidade operacional e risco de concentrar chaves quentes |
| Workers KV | Persistência simples e barata | Binding KV e operações de leitura/escrita | Consistência eventual; inadequado como contador estrito |
| D1/contador externo | Estado durável | Banco, latência, credenciais e manutenção | Latência de cada request e risco de indisponibilidade dependente |
| Redis/Upstash | Contadores atômicos maduros | Serviço externo, segredo, custo/egress | Novo operador e dependência de rede |

## Recomendação pendente de decisão

Usar WAF/Rate Limiting Rules para proteção ampla por IP/rota e manter limites de aplicação para tokens, contas e operações sensíveis. Antes de implementar Durable Objects ou Redis, a equipe deve aprovar fornecedor, orçamento, retenção dos contadores, regiões e comportamento em falha. Nenhuma dessas decisões foi tomada nesta fase.

