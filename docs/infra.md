# Infraestrutura - Servidor, Deploy e Operacao

Como a plataforma fica de pe: o que roda no servidor, em que ordem instalar,
como conferir que deu certo e como desfazer quando nao deu.

Nada aqui roda sozinho. Os scripts em `scripts/infra/` sao para o Paulo executar
na VPS — nenhum agente tem acesso a ela, e nao deve ter.

---

## O servidor

Hostinger KVM 8, Ubuntu 24.04 LTS, **uma unica maquina**.

| Item | Valor | Situacao |
| --- | --- | --- |
| vCPU | 8 | a confirmar |
| RAM | 32 GB | a confirmar |
| Disco | 400 GB NVMe | a confirmar |
| IP / dominio | — | **pendente** |

As specs sao as da linha KVM 8 no catalogo; os tetos de memoria da Etapa 4
foram dimensionados por elas. Antes de rodar a Etapa 4, confirme com:

```bash
nproc && free -h && df -h /
```

Se vier diferente, ajuste `MEM_APP` e `MEM_PG` em `scripts/infra/04-ambiente.sh`
e diga aqui qual e o numero real.

---

## Quatro VPS viraram uma

O `CLAUDE.md` da raiz descreve quatro VPS: frontend e backend separados, HML e
PRD, cada par em maquinas distintas. Foi comprada uma. **Nao vale fingir que a
arquitetura foi cumprida.**

Duas observacoes honestas, e elas puxam para lados diferentes:

**A separacao frontend/backend nunca se aplicou a este produto.** O `perfila/` e
Next.js App Router com Server Components e Server Actions. Nao existe API
separada para morar em outra maquina — a decisao esta no ADR-0001 e o
`CLAUDE.md` confirma ("usar server-side nativo, sem API separada"). Duas das
quatro VPS eram para um backend que este projeto nao tem. O desenho real que
falta nao e 4 -> 1: e **2 -> 1**, uma maquina para HML e outra para PRD.

**A separacao HML/PRD, essa sim, foi perdida de verdade.** O que da para
recuperar dentro de uma maquina, e o que nao da, esta no
[ADR-0005](adr/0005-uma-vps-para-hml-e-prd.md). Resumo: processo, usuario de
banco, porta, segredo e volume ficam separados de verdade; kernel, disco, IP e
janela de manutencao sao compartilhados e nao ha como separar.

---
## Desenho — o que roda onde

O EasyPanel (ADR-0006) e dono do proxy, do TLS e do build. O que esta fora dele
— acesso, firewall, backup e monitoramento — continua sendo nosso, de proposito:
se o painel cair, essas quatro coisas precisam continuar de pe.

```
                          internet
                             |
                        [ UFW ] SSH, 80, 443 — o resto fechado
                             |
                    [ Traefik do EasyPanel ]  TLS, roteamento por dominio
                    /            |            \
       painel.perfila     hml.perfila       app.perfila
       (2a autenticacao)   projeto hml       projeto prd
                                |                 |
                          app + postgres    app + postgres
                          (containers)      (containers)

     fora do painel:  01/02 acesso e firewall · backup.sh · restore.sh
                      monitor.sh · timers do systemd
```

Nada alem do Traefik escuta em interface publica. O Postgres nunca — e isso
precisa ser CONFERIDO depois de criar cada servico, e nao presumido.

```
/srv/valmer/
  bin/                       scripts de operacao (os timers chamam daqui)
  monitor.env                HEARTBEAT_URL e o que checar (0600)
  <amb>/
    env/backup.env           DATABASE_URL e destino off-site (0600)
    backups/                 dumps diarios + semanal/
```

As variaveis da aplicacao vivem no painel. O `backup.env` existe porque os
scripts de backup rodam fora dele e precisam da string de conexao — e a unica
duplicata, e ela e deliberada.

Usuarios: `paulo` (sudo, administra) e `deploy` (sem sudo). Root nao entra por
SSH. O painel tem conta propria, que **nao** e a do sistema.

## Ordem de instalacao

Cada etapa tem objetivo, comando, como conferir e como desfazer. Etapa que nao
da para conferir nem desfazer nao esta pronta.

Os scripts sao idempotentes: rodar de novo nao quebra o que ja esta certo.
Copie a pasta `scripts/infra/` para o servidor (`scp -r scripts/infra
root@<ip>:/root/`) ou clone o repositorio la.

Antes de subir, `bash scripts/infra/testar-infra.sh` confere a sintaxe de todos
eles e a leitura da `DATABASE_URL` — a parte que decide em qual banco o
`pg_dump` bate. Uma porta lida errado faz o backup de producao dumpar
homologacao sem reclamar.

### Etapa 1 — Acesso  *(obrigatoria agora)*

Trava tudo o mais: sem entrar na maquina com seguranca, o resto nao comeca.

```bash
ADMIN_USER=paulo SSH_PORT=2222 bash 01-acesso.sh
```

Cria `paulo` (sudo) e `deploy` (sem sudo), muda a porta do SSH, desliga senha,
tira o login direto de root, instala o fail2ban.

O script **nao desliga a senha** enquanto `paulo` nao tiver uma chave publica —
ficar do lado de fora da propria maquina e o jeito mais comum de estragar este
passo. Se ele avisar que falta chave, rode da sua maquina e repita a etapa:

```bash
ssh-copy-id -p 22 paulo@<ip>
```

No Ubuntu 24.04 o sshd sobe por socket activation: mudar `Port` no
`sshd_config` nao tem efeito nenhum. O script escreve um override em
`ssh.socket`, que e o que funciona.

- **Conferir**: de um terminal NOVO, `ssh -p 2222 paulo@<ip>` entra;
  `ssh root@<ip>` e recusado; `sudo fail2ban-client status sshd` responde.
  **So feche a sessao antiga depois disso.**
- **Desfazer**: `rm /etc/ssh/sshd_config.d/99-valmer.conf` e
  `rm -rf /etc/systemd/system/ssh.socket.d`, depois
  `systemctl daemon-reload && systemctl restart ssh.socket ssh`.

### Etapa 2 — Firewall  *(obrigatoria agora)*

```bash
sudo bash 02-firewall.sh
```

Nega tudo que entra, libera 80, 443 e a porta do SSH (com `limit`). A porta e
lida do que a Etapa 1 configurou, e nao de uma segunda copia da verdade.

O Docker escreve direto no iptables: uma porta publicada como `-p 5432:5432`
**fura o UFW**. Por isso todo compose deste projeto publica como
`127.0.0.1:PORTA:5432`. Se alguem trocar, o banco vai para a internet com o
firewall fechado e nada avisa.

- **Conferir**: `sudo ufw status verbose` mostra `deny (incoming)` e so as tres
  portas. De fora: `nmap <ip>` nao mostra 5432.
- **Desfazer**: `sudo ufw disable`.

### Etapa 3 — Runtime  *(obrigatoria agora)*

```bash
sudo bash 03-runtime.sh
```

Patch de seguranca automatico (com reboot as 04:00), Docker,
`postgresql-client-16` (o `pg_dump` roda no host) e 4 GB de swap.

Node, Nginx e Certbot **nao** entram aqui: no caminho do painel quem faz proxy e
TLS e o Traefik, e um Nginx ocupando 80 e 443 impede o painel de subir. Quem for
pelo Anexo os instala com o `04-ambiente.sh`.

O `deploy` entra no grupo `docker` para subir e descer o Postgres. Grupo docker
equivale a root na maquina — e uma concessao consciente: sem ela, cada operacao
de banco precisaria de sudo, e a chave que o CI usa passaria a ter caminho para
sudo. O risco fica contido pelo que o `deploy` **nao** tem: shell interativo
comum, senha e acesso a `/etc/sudoers.d` alem da linha dos servicos.

- **Conferir**: `docker ps`, `free -h` (swap 4G),
  `systemctl status unattended-upgrades`.
- **Desfazer**: `sudo apt-get remove --purge docker-ce` e
  `sudo swapoff /swapfile`.
### Etapa 4 — EasyPanel  *(obrigatoria)*

O painel instala o proprio Docker, sobe o Traefik e assume 80 e 443. Por isso o
03 nao instala mais Nginx: os dois brigam pela mesma porta.

```bash
curl -sSL https://get.easypanel.io | sh
```

Depois: aponte um subdominio (ex.: `painel.perfila.com.br`) para o IP, abra o
painel, crie a conta de administrador com senha longa e unica, e configure o
dominio do painel dentro dele para que ele emita o proprio certificado.

- **Conferir**: `docker ps` mostra os containers do painel; `curl -I
  https://painel...` responde 200; acessar pelo IP **nao** deve servir o painel.
- **Desfazer**: `docker rm -f` nos containers do painel e apagar `/etc/easypanel`.
  Feito isso, o caminho manual do Anexo volta a ser possivel.

### Etapa 5 — Proteger o painel  *(obrigatoria, junto com a 4)*

Quem entra no painel controla os dois ambientes e todos os segredos. **A senha
do painel nao pode ser a unica coisa entre a internet e o root da maquina.**

1. Segunda camada antes do painel: Cloudflare Access no subdominio, ou
   restricao por IP. Sem isso, uma senha vazada entrega a plataforma inteira.
2. 2FA no painel, se o produto oferecer — **a verificar na instalacao**.
3. Painel so pelo subdominio, nunca por IP.
4. Atualizar o painel faz parte da rotina: e software exposto na internet.

- **Conferir**: de uma rede nao autorizada, o painel nao deve nem mostrar a tela
  de login. Se mostrar, a camada 1 nao esta valendo.
- **Desfazer**: remover a politica de acesso — e voltar a ter so a senha.

### Etapa 6 — Os dois ambientes no painel  *(HML primeiro)*

Um **projeto** por ambiente: `valmer-hml` e `valmer-prd`. Dentro de cada um,
dois servicos: a aplicacao (do repositorio, pasta `perfila/`) e o Postgres.

Configuracao que nao e opcional:

| Item | HML | PRD |
| --- | --- | --- |
| Branch de deploy | `develop` | `master` |
| Dominio | `hml.perfila.com.br` | `app.perfila.com.br` |
| Limite de memoria | 4 GB | 8 GB |
| Postgres | servico proprio, **sem porta publicada** | idem |

Variaveis, por ambiente: `DATABASE_URL`, `BETTER_AUTH_SECRET` (um por ambiente,
`openssl rand -base64 32`), `BETTER_AUTH_URL`, `ANTHROPIC_API_KEY` e
`NODE_ENV=production`.

**`SESSAO_DEV_USUARIO_ID` nunca.** Ela entra como qualquer usuario sem senha, e
o unico freio e `NODE_ENV=production`. No painel ela entra com dois cliques —
antes exigia editar um arquivo `0600` por SSH. Nao a crie em ambiente nenhum.

As migracoes (`npm run db:migrate`) precisam rodar no deploy. Onde isso se
configura no EasyPanel — comando de build, de start ou hook — **fica a verificar
na instalacao**; nao vale inventar a tela que ninguem viu.

- **Conferir**: `https://hml...` responde 200 e o login funciona (o cookie
  `secure` exige TLS valido); `ss -ltnp | grep 5432` **nao** mostra `0.0.0.0`;
  publicar um commit em `develop` atualiza so o HML.
- **Desfazer**: o painel guarda historico de deploy — redeploy do commit
  anterior. **Isso devolve o codigo, nao o banco**; ver a secao de rollback.

### Etapa 7 — Backup e restore  *(obrigatoria antes do PRD receber dado real)*

Configure o destino off-site antes de ligar o agendamento:

```bash
sudo -u deploy rclone config                       # uma vez, interativo
echo 'BACKUP_REMOTE=<remote>:valmer/prd' | sudo -u deploy tee /srv/valmer/prd/env/backup.env
sudo chmod 600 /srv/valmer/prd/env/backup.env
```

`backup.sh` faz o dump com as flags do `CLAUDE.md`, confere que ele nao esta
vazio (tamanho e cabecalho), copia semanal aos domingos, manda para fora e
aplica a retencao (diario 30 dias, semanal 90). **PRD sem destino off-site
falha de proposito**: backup que nunca saiu do servidor vai junto com o disco.

- **Conferir** — o unico teste que vale e o restore:
  ```bash
  sudo -u deploy bash /srv/valmer/bin/backup.sh prd
  sudo -u deploy bash /srv/valmer/bin/restore.sh hml /srv/valmer/prd/backups/<arquivo>.sql
  ```
  O `restore.sh` para o servico, restaura, conta tabelas e usuarios ativos, e
  sobe de novo. Se o schema voltar incompleto, ele falha. **Repita uma vez por
  mes** — backup sem restore testado e suposicao.
- **Desfazer**: o restore em HML e destrutivo em HML e so em HML. Producao exige
  `CONFIRMA=RESTAURAR-PRD` explicito.

### Etapa 8 — Agendamentos e monitoramento  *(obrigatoria)*

```bash
sudo bash 05-agendamentos.sh
```

Timers do systemd: backup diario 02:00 por ambiente, checagem de saude a cada
10 minutos, e limite de 500 MB no journal (log sem teto enche disco e derruba a
maquina inteira).

O alerta precisa chegar em alguem. Crie um check gratuito no Healthchecks.io e:

```bash
echo 'HEARTBEAT_URL=https://hc-ping.com/<uuid>' | sudo tee /srv/valmer/monitor.env
sudo chmod 600 /srv/valmer/monitor.env
```

`monitor.sh` verifica disco acima de 85%, servico parado, Postgres sem
responder, app sem responder e certificado a menos de 14 dias do vencimento.
Rodada boa manda um ping; rodada ruim manda a lista de problemas para
`/fail`, e o Healthchecks manda e-mail. O ping serve tambem como
dead-man's-switch: **se a maquina morrer inteira, o silencio dispara o
alerta** — que e a unica forma de um monitor que roda na propria maquina avisar
que a maquina caiu.

- **Conferir**: `systemctl list-timers 'valmer-*'`; force uma rodada com
  `sudo systemctl start valmer-monitor.service` e veja o check ficar verde;
  pare o HML de proposito (`sudo systemctl stop valmer-hml`), rode de novo e
  confirme que o e-mail chega.
- **Desfazer**:
  `sudo systemctl disable --now valmer-backup@{hml,prd}.timer valmer-monitor.timer`.

---

## Operacao do dia a dia

| Situacao | Onde |
| --- | --- |
| Publicar em HML | push em `develop` — o painel publica sozinho |
| Publicar em PRD | merge em `master` — **com backup antes**, ver abaixo |
| Voltar a versao anterior | painel: historico de deploy, redeploy do commit anterior |
| Ver log da app, variaveis, containers | painel |
| Backup manual | `bash /srv/valmer/bin/backup.sh prd` |
| Testar o restore | `bash /srv/valmer/bin/restore.sh hml` |
| Estado geral (fora do painel) | `valmer status` |
| Abrir o banco | `valmer db prd` |

O que esta no painel voce aprende em video. O que ficou no SSH e justamente o
que nao pode depender do painel estar de pe.
### Por que ha painel, e o que ele custa

A decisao esta no ADR-0006. O motivo nao e tecnico, e de continuidade: uma
estrutura sob medida so se aprende com quem a escreveu, e a hipotese de trabalho
e que essa pessoa pode nao estar mais no projeto. EasyPanel se aprende por
material publico.

O preco esta pago com olhos abertos, e nao escondido:

- **O painel e root na maquina.** Uma sessao de navegador vazada desfaz a chave
  de SSH, o UFW e o fail2ban de uma vez. E por isso que a Etapa 5 nao e opcional.
- **Deploy deixa de ter uma verdade so.** Mitigado ao amarrar cada projeto a uma
  branch e nao publicar por upload manual.
- **Dependencia de produto.** Por isso o Anexo existe.

**Portainer nao entra.** O EasyPanel ja mostra container, log e variavel; o
Portainer nao acrescenta capacidade e soma mais uma porta com acesso ao Docker.

Backup, restore e monitoramento seguem **fora** do painel, por timer do systemd.
Se o painel cair, o backup continua.

### Rollback — o que ele devolve e o que nao devolve

No painel: historico de deploy, redeploy do commit anterior. E rapido e a
imagem antiga ainda esta la.

**Ele devolve o codigo, nao o banco.** Se o deploy que voce esta desfazendo
rodou migracao, o schema continua o novo e o codigo antigo pode nao entender
mais as tabelas. Nesse caso e preciso o dump anterior ao deploy:

```bash
CONFIRMA=RESTAURAR-PRD bash /srv/valmer/bin/restore.sh prd /srv/valmer/prd/backups/<arquivo>.sql
```

**Regressao que veio junto com o painel, e precisa de disciplina:** o
`deploy.sh` fazia o dump de PRD sozinho, antes de migrar. O painel nao faz. Ate
existir um hook de pre-deploy — **a verificar na instalacao** — a regra do
`CLAUDE.md` ("SEMPRE backup ANTES de deploy em PRD") passa a depender de alguem
lembrar:

```bash
bash /srv/valmer/bin/backup.sh prd      # ANTES de mergear em master
```

Drizzle nao gera migracao reversivel automatica. Enquanto for assim, restore e o
unico rollback de schema que existe aqui. **Ensaie isso em HML antes de
precisar.**

---

## Seguranca — decisoes registradas

**O Postgres nunca sai do localhost.** Publicado como `127.0.0.1:PORTA:5432`,
sem regra de firewall, com usuario e senha proprios por ambiente. Isso e a
mitigacao que o ADR-0004 pede em texto: o token de sessao fica em claro na
tabela `sessoes`, e quem le essa tabela se passa por qualquer sessao viva.
Restringir acesso ao banco e o que segura essa ponta.

**`SESSAO_DEV_USUARIO_ID` nao pode existir no servidor.** A funcao
`sessaoDeDesenvolvimento` (`src/lib/auth/sessao.ts`) entra como qualquer usuario
sem senha, e o unico freio e `NODE_ENV === "production"`. Os dois ambientes
declaram `NODE_ENV=production`, e a variavel nao existe em nenhum deles. Com o
painel ela passou a ser dois cliques em vez de um arquivo `0600` por SSH — o
risco de alguem a criar "so para testar" subiu, e nao desceu.

**Segredos.** As variaveis da aplicacao vivem no painel. A copia da
`DATABASE_URL` em `/srv/valmer/<amb>/env/backup.env` e `0600`, dono `deploy`, e
existe porque o backup roda fora do painel. Nada disso esta no git, passa pelo
GitHub ou vai em `ARG` de Dockerfile — e nao aparece em linha de comando: o
`backup.sh` exporta `PGPASSWORD` em vez de passar a URL como argumento, porque
argumento de processo aparece inteiro num `ps aux` para qualquer usuario da
maquina.

**A string de conexao de producao nao e secret do GitHub.** O backup roda no
proprio servidor. Um dump de producao carrega nome, e-mail e resultado de
assessment de gente real; ele nao passa pela infraestrutura de terceiro nem vira
artifact do Actions.

**Superficie minima, com uma excecao assumida.** So o Traefik do painel escuta
em porta publica: sem FTP, sem banco exposto. A excecao e o proprio painel, que
e administracao de servidor exposta na internet — o ADR-0006 registra o porque,
e a Etapa 5 e o que impede que ele seja a porta mais fraca da casa.

---

## O que ficou de fora, e quando entra

**Redis / BullMQ.** A fila FIFO do `CLAUDE.md` ainda nao tem consumidor: nao ha
envio de e-mail nem geracao de PDF implementados. Entra junto com o primeiro
job assincrono de verdade — mais um container, `127.0.0.1:6379`, teto de 512 MB.

**Puppeteer / Chromium.** Quando o PDF sair do papel: `apt-get install
chromium-browser` mais as dependencias de fonte, `--no-sandbox` **nao** (rodar
Chromium sem sandbox recebendo HTML gerado a partir de dado de usuario e
entregar execucao de codigo). Reserve 1 GB por instancia e limite a uma de cada
vez, ou o PDF passa a ser o processo que come a memoria do PRD. Isso muda os
tetos da Etapa 4 e deve virar revisao deste documento.

**Segunda VPS.** O gatilho esta no ADR-0005. Em resumo: quando existir cliente
pagante com dado real, PRD vai sozinho para uma maquina propria e HML fica com
esta. Nao e "quando sobrar orcamento", e sim quando a queda deixar de ser
constrangimento e passar a ser prejuizo.

**Metrica e APM.** Fora de escopo agora. O monitor responde "esta de pe?" e nao
"esta rapido?". Prometheus, Grafana e afins entram quando houver volume que
justifique.

---

## Pendencias — dependem do Paulo

| # | O que falta | Trava o que |
| --- | --- | --- |
| 1 | Dominios de HML, PRD **e do painel**, com DNS apontando para o IP | Etapas 4 a 6 |
| 2 | Confirmar vCPU, RAM e disco reais (`nproc && free -h && df -h /`) | limites da Etapa 6 |
| 3 | Chave da Anthropic nas variaveis de cada ambiente, no painel | geracao de narrativa |
| 4 | Destino off-site do backup (`rclone config`) e a `DATABASE_URL` em `backup.env` | Etapa 7 |
| 5 | Check no Healthchecks.io, `HEARTBEAT_URL` e os `CHECK_*` em `monitor.env` | Etapa 8 |
| 9 | Segunda camada de autenticacao na frente do painel (Cloudflare Access ou IP) | Etapa 5 — **sem isso o painel e a porta mais fraca** |
| 10 | Verificar no painel: 2FA, hook de pre-deploy e onde rodam as migracoes | Etapas 5 e 6, e o backup antes do PRD |
| 6 | Renomear `main` para `master` no GitHub e enviar a `develop` (ver abaixo) | o CI, que dispara nelas |
| 7 | Secrets de SSH no GitHub, por Environment `hml` e `prd` | deploy automatico |
| 8 | Variavel `DEPLOY_HABILITADO=true` nos Environments, quando a VPS existir | o job de deploy, que fica parado ate la |

### Branches — o estado hoje e o que falta

Remoto: `develop` (publicada, com todo o trabalho), `master` e `main` — as duas
ultimas no mesmo commit `8e8c98b`, o estado anterior ao app, com `main` ainda
marcada como padrao.

`master` nasceu de um `push origin main:master`, e nao do renomear do GitHub.
Da no mesmo, com uma perda: o renomear cria redirecionamento automatico de links
e PRs antigos, e o push nao. Sem PR aberto, o custo e zero — mas fica registrado
para ninguem procurar um redirecionamento que nao existe.

`master` aponta para o estado anterior ao app de proposito: nada foi validado em
HML ainda, e a primeira publicacao em PRD e o merge `develop -> master` depois
dessa validacao — o fluxo do `CLAUDE.md`, sem atalho.

Falta desfazer a duplicata. `main` e `master` sao a mesma coisa com dois nomes, e
o git nao apaga a branch padrao: e preciso trocar o padrao primeiro, e isso so
existe na interface do GitHub.

1. Settings > General > Default branch > trocar `main` por `master`.
2. Depois, daqui:

```bash
git push origin --delete main
git fetch origin --prune
git branch -D main
git remote set-head origin -a
```

- **Conferir**: `git branch -r` mostra so `origin/develop`, `origin/master` e
  `origin/HEAD -> origin/master`.
- **Desfazer**: `git push origin master:main` recria a branch, e o padrao volta
---

## Anexo — o caminho manual, sem painel

`04-ambiente.sh` e `deploy.sh` montam a estrutura anterior: systemd para a
aplicacao, Nginx para proxy e TLS, Postgres em compose no localhost, deploy por
release com symlink e rollback em segundos.

Eles **nao sao apagados** de proposito. Se o EasyPanel quebrar numa atualizacao,
mudar de licenca ou for descontinuado, esta e uma estrutura que ja funcionava, e
o historico do git prova. Os dois caminhos nao convivem: o Nginx do manual e o
Traefik do painel disputam 80 e 443.

```bash
sudo DOMINIO=hml.perfila.com.br bash 04-ambiente.sh hml   # instala Node/Nginx/Certbot
sudo certbot --nginx -d hml.perfila.com.br --agree-tos -m <email> --redirect --hsts
sudo -u deploy bash /srv/valmer/bin/deploy.sh hml develop
```

Nesse caminho o `monitor.env` pode ficar sem os `CHECK_*`: o `monitor.sh` cai
sozinho no padrao de systemd nas portas 3000 e 3001.
