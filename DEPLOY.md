# Preparação para deploy do Acolhe

O frontend é um aplicativo React com CRA e CRACO. A API FastAPI e o MongoDB precisam de hospedagem separada. Esta configuração prepara uma revisão; não publica o serviço nem substitui a validação com dados e domínio reais.

## Frontend no Cloudflare Pages

- Diretório raiz: `frontend`
- Instalação: `yarn install --frozen-lockfile`
- Build: `yarn build`
- Saída: `build`
- Variável pública de build: `REACT_APP_BACKEND_URL` com a origem HTTPS **real** da API, sem `/api` e sem barra final, depois que o backend estiver hospedado.

O Cloudflare Pages reconhece a aplicação como SPA e encaminha as rotas para o frontend. Sem `REACT_APP_BACKEND_URL`, o build conclui e exibe apenas uma página de indisponibilidade: login, cadastro e outros fluxos não ficam acessíveis. Uma URL preenchida e inválida continua bloqueando o build. O cliente também impede requisições à API se a variável estiver vazia, para não enviar dados ao host do frontend por engano.

No painel do projeto Pages, configure a variável em **Settings > Environment variables** para o ambiente de produção e, se necessário, para preview. Confirme primeiro que a API responde em `/api/` sob essa origem HTTPS; só então preencha a variável e refaça o deploy. A URL do backend aparece no JavaScript enviado ao navegador; nunca coloque segredos em variáveis `REACT_APP_*`.

## Backend no Render

O repositório inclui `render.yaml` para criar o serviço `acolhe-api` pelo fluxo **New > Blueprint** do Render. A configuração usa a pasta `backend`, instala `requirements.txt`, inicia `uvicorn server:app --host 0.0.0.0 --port $PORT` e verifica `/api/`.

Durante a criação do Blueprint, informe estes valores no Render:

| Variável | Valor a informar |
| --- | --- |
| `MONGO_URL` | String de conexão do MongoDB Atlas. |
| `DB_NAME` | Nome do banco do Acolhe. |
| `CORS_ORIGINS` | Origem exata do frontend, por exemplo `https://acolhe-mvp-1-17.luccasuper1.workers.dev`. |
| `FRONTEND_URL` | A mesma origem HTTPS, usada nos links de recuperação de senha. |
| `ADMIN_EMAIL` e `ADMIN_PASSWORD` | Primeiro administrador; o serviço não altera a senha se o usuário já existir. |

O Render gera `JWT_SECRET` automaticamente e mantém esse valor fora do repositório. Quando o deploy terminar, abra `https://<seu-serviço>.onrender.com/api/`: a resposta esperada inclui `"status": "ok"`. Depois copie somente a origem do serviço (sem `/api`) para `REACT_APP_BACKEND_URL` no Cloudflare e dispare um novo build.

## Backend

Instale `backend/requirements.txt` e execute `uvicorn server:app` a partir de `backend`, com TLS no domínio público. Configure no ambiente do serviço:

| Variável | Uso |
| --- | --- |
| `APP_ENV=production` | Desativa modos de piloto inseguros. |
| `MONGO_URL` e `DB_NAME` | Conexão e banco MongoDB. |
| `JWT_SECRET` | Segredo aleatório forte, com pelo menos 32 caracteres, para assinar sessões. |
| `ADMIN_EMAIL` e `ADMIN_PASSWORD` | Criam o primeiro administrador se ele ainda não existir; forneça ambos. |
| `CORS_ORIGINS=https://seu-projeto.pages.dev` | Origens exatas permitidas, separadas por vírgula. Não use `*`. |
| `FRONTEND_URL=https://seu-projeto.pages.dev` | Origem HTTPS para links de recuperação. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | Envio de e-mail de recuperação. A porta padrão é 587 com STARTTLS; 465 usa TLS direto. |
| `SMTP_USER` e `SMTP_PASSWORD` | Autenticação SMTP, quando o servidor exigir. |

Sem SMTP, o endpoint de recuperação retorna indisponível; ele não divulga tokens. `PILOT_RETURN_RESET_TOKEN=true` só habilita o retorno do token fora de `APP_ENV=production`, para testes controlados. `SEED_DEMO_DATA=true` cria contas de exemplo apenas fora de produção e exige `DEMO_PASSWORD` com pelo menos 12 caracteres. Ambas as opções ficam desligadas por padrão.

Antes de conectar um banco já usado no piloto, remova ou troque as senhas das contas de demonstração existentes. Os testes antigos continham uma senha administrativa no repositório; troque essa senha no banco e avalie a rotação de `JWT_SECRET` se já houve exposição. A nova inicialização não redefine senhas de usuários existentes.

## Validação

O build local foi feito com `REACT_APP_BACKEND_URL=https://api.example.com` apenas para verificar a compilação. Os testes unitários do backend podem ser executados com `pip install -r backend/requirements-dev.txt` e `pytest` em `backend`. Os testes de integração exigem `ACOLHE_TEST_BACKEND_URL`, `ACOLHE_TEST_PILOT_CODE` e as variáveis `ACOLHE_TEST_{ADMIN,INST,PRO,STU}_{EMAIL,PASSWORD}` em um ambiente de teste isolado. `ACOLHE_TEST_PILOT_RESET=true` habilita o caso de teste de recuperação no modo piloto.
