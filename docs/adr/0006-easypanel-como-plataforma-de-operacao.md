# ADR-0006: EasyPanel como plataforma de operacao

- **Status**: Aceito
- **Data**: 2026-09-03
- **Decisores**: Paulo (cliente do repositorio), infra

## Contexto

O plano original (ADR-0005 e `docs/infra.md`) montava a operacao a mao: systemd
para a aplicacao, Nginx para proxy e TLS, Docker so para o Postgres, e um
`deploy.sh` chamado pelo CI. E enxuto, tem pouca superficie exposta e cada peca
faz uma coisa.

Tem um defeito que a analise tecnica sozinha nao pega: **e uma estrutura que so
existe neste projeto**. Nao ha tutorial, video ou curso sobre ela. Quem assumir
depois do Paulo precisa aprender pelo `docs/infra.md` e pelo codigo dos scripts,
com uma pessoa so no mundo capaz de responder duvida — e a hipotese de trabalho
e justamente que essa pessoa pode nao estar mais no projeto.

Paulo levantou o ponto: uma plataforma pronta e conhecida se aprende por
material publico. Isso e fator de onibus, e nao preferencia de ferramenta.

## Decisao

**EasyPanel** como plataforma de operacao da VPS. Ele passa a ser dono do proxy
reverso, do TLS, do build a partir do git, das variaveis de ambiente e da visao
de containers e logs.

**Portainer nao entra.** O EasyPanel ja mostra container, log e variavel. O
Portainer nao acrescentaria capacidade, e cada painel com acesso ao socket do
Docker e mais uma porta que da root na maquina. Um painel e um risco assumido;
dois sao dois riscos pelo mesmo beneficio.

O que **nao** muda, e continua fora do painel:

- **Acesso e firewall** (Etapas 1 e 2). Chave de SSH, root sem login, fail2ban e
  UFW fechado sao anteriores ao painel e valem igual. O painel nao substitui
  nada disso — ele se apoia nisso.
- **Backup, restore e monitoramento** (`backup.sh`, `restore.sh`, `monitor.sh`).
  Painel costuma oferecer backup de volume; o que temos faz dump conferido,
  copia off-site obrigatoria em PRD e restore validado com contagem de tabela.
  E melhor, e nao ha motivo para trocar por menos.
- **ADR-0005**. Continua sendo uma maquina para HML e PRD, com tudo o que se
  perde nisso. Painel nao cria isolamento de host.

## Alternativas Consideradas

- **Manter a estrutura a mao (plano original).** Menos superficie, uma verdade
  so para deploy, nada de UI exposta. Recusada pelo fator de onibus: a economia
  de risco tecnico foi paga com risco de continuidade, e a continuidade e o
  problema real deste projeto.
- **Portainer no lugar do EasyPanel.** Portainer mostra containers, mas nao faz
  proxy reverso, nem TLS, nem deploy a partir do git. Adota-lo deixaria Nginx,
  certbot e `deploy.sh` como estao — ou seja, manteria justamente a parte que
  ninguem aprende por video, e ainda somaria um painel.
- **EasyPanel e Portainer juntos**, como cogitado no pedido. Ver acima: sem
  ganho de capacidade, com o dobro de superficie.
- **Plataforma gerenciada (Vercel + banco gerenciado).** Resolveria operacao,
  backup e TLS sem servidor nenhum. Fora de cogitacao: a VPS ja esta paga, e o
  custo recorrente de banco gerenciado nao foi orcado.

## Consequencias

### Positivas
- Quem assumir o projeto aprende a operacao por material publico, e nao por um
  documento interno e uma pessoa.
- Deploy, TLS, variavel de ambiente e log passam a ter interface grafica: o dono
  da plataforma consegue olhar sem SSH.
- Menos codigo nosso para manter — Nginx, certbot e `deploy.sh` saem do nosso
  perimetro de manutencao.

### Negativas / Trade-offs
- **O painel e root na maquina.** Quem entra nele controla todos os containers e
  todos os segredos dos dois ambientes. Uma sessao de navegador vazada desfaz a
  chave de SSH, o UFW e o fail2ban de uma vez. E o custo central desta decisao, e
  o que o mitiga esta na lista abaixo — nada disso e opcional.
- **Deploy deixa de ter uma verdade so.** Quem publica passa a ser o painel, e
  nao o git. Duas pessoas podem discordar sobre qual versao esta no ar. Mitigado
  ao ligar o deploy do painel a branch (`develop` -> HML, `master` -> PRD) e
  proibir deploy manual por upload.
- **Dependencia de produto.** Se o EasyPanel mudar de licenca, quebrar em uma
  atualizacao ou for descontinuado, a operacao inteira depende dele. Por isso os
  scripts do plano manual **nao serao apagados**: ficam em `scripts/infra/` como
  caminho de volta, com o historico do git provando que funcionavam.
- **Variavel de ambiente por UI e mais facil de errar.** `SESSAO_DEV_USUARIO_ID`
  entra com dois cliques e derruba a autenticacao inteira (ver `docs/infra.md`).
  Antes exigia editar um arquivo `0600` por SSH.
- Uma atualizacao do painel pode derrubar os dois ambientes ao mesmo tempo.

### Mitigacoes obrigatorias

Sem estas, a decisao nao esta implementada — esta pela metade:

1. Painel em subdominio proprio, com TLS, **nunca** acessivel por IP.
2. Segunda camada de autenticacao antes do painel (Cloudflare Access ou
   restricao por IP), para que a senha do painel nao seja a unica coisa entre a
   internet e o root da maquina.
3. Senha longa e unica, e 2FA se o produto oferecer — **a verificar na
   instalacao**.
4. Postgres sem porta publicada. Conferir com `ss -ltnp` depois de criar cada
   servico, e nao confiar no padrao.
5. `backup.sh`, `restore.sh` e `monitor.sh` seguem rodando por timer do systemd,
   fora do painel — se o painel cair, o backup continua.

### Neutras
- O `.github/workflows/deploy.yml` continua util pelo job de CI (typecheck,
  migracoes, testes, build, compliance). O job de deploy fica desligado por
  `DEPLOY_HABILITADO`, ja previsto, e o painel assume a publicacao.
