# Plano reproduzível de homologação com MongoDB isolado

1. Criar projeto/cluster separado do Atlas de produção (ou `mongod` local), com URI e nome de banco exclusivos, sem reutilizar credenciais, allowlist restrita ao runner e backup separado.
2. Gerar somente fixtures sintéticas: duas instituições, dois estudantes, dois profissionais, contas institucionais e um administrador. Nunca importar documentos da base real.
3. Configurar `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `APP_ENV=test` e `pilot_enabled=false`; manter `TEST_MODE` restrito ao processo local e a um segredo efêmero.
4. Iniciar o gateway/Worker local apontando para esse banco e executar, em ordem, as suítes dinâmicas de autorização, concorrência, links e rate limiting.
5. Capturar apenas métodos, rotas, códigos HTTP, contagens e IDs sintéticos redigidos. Não registrar tokens, e-mails ou conteúdo livre.
6. Ao final, invalidar credenciais do ambiente, remover a base/cluster de teste e confirmar que nenhum endpoint de produção foi chamado.

Limitação atual: este ambiente não possui MongoDB real disponível; o gateway JSON local não é prova equivalente de atomicidade distribuída. A homologação descrita permanece pendente.

