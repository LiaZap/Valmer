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

```
                          internet
                             |
                        [ UFW ] 22/2222, 80, 443 — o resto fechado
                             |
                        [ Nginx ]  TLS, HSTS, cabecalhos, rate limit /api/auth
                       /                    \
        app.perfila (PRD)                hml.perfila (HML)
        127.0.0.1:3000                   127.0.0.1:3001
        systemd valmer-prd               systemd valmer-hml
        MemoryMax 8G  CPUWeight 200      MemoryMax 4G  CPUWeight 50
              |                                  |
        127.0.0.1:5432                     127.0.0.1:5433
        docker valmer_prd_db               docker valmer_hml_db
        volume valmer_prd_pgdata           volume valmer_hml_pgdata
```

Nada alem do Nginx escuta em interface publica. O Postgres nunca.

```
/srv/valmer/
  bin/                       scripts de operacao (o CI e os timers chamam daqui)
  <amb>/
    env/app.env              DATABASE_URL, BETTER_AUTH_SECRET, ANTHROPIC_API_KEY (0600)
    env/postgres.env         senha do banco (0600)
    env/backup.env           destino off-site (0600)
    repo/                    clone bare, cache do git
    releases/<data>-<sha>/   uma pasta por publicacao, as 3 ultimas
    current -> releases/...  o que esta no ar
    backups/                 dumps diarios + semanal/
    postgres.compose.yml
```

Usuarios: `paulo` (sudo, administra) e `deploy` (sem sudo; so pode reiniciar
`valmer-hml` e `valmer-prd`). Root nao entra por SSH.

---

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

Patch de seguranca automatico (com reboot as 04:00), Docker, Node 22 LTS,
Nginx, Certbot, `postgresql-client-16` e 4 GB de swap.

O `deploy` entra no grupo `docker` para subir e descer o Postgres. Grupo docker
equivale a root na maquina — e uma concessao consciente: sem ela, cada operacao
de banco precisaria de sudo, e a chave que o CI usa passaria a ter caminho para
sudo. O risco fica contido pelo que o `deploy` **nao** tem: shell interativo
comum, senha e acesso a `/etc/sudoers.d` alem da linha dos servicos.

- **Conferir**: `docker ps`, `node -v` (v22), `nginx -t`, `free -h` (swap 4G),
  `systemctl status unattended-upgrades`.
- **Desfazer**: `sudo apt-get remove --purge docker-ce nodejs nginx certbot` e
  `sudo swapoff /swapfile`.

### Etapa 4 — Ambientes  *(HML obrigatoria; PRD quando houver dominio)*

Uma vez por ambiente. **Precisa do DNS ja apontando para o IP.**

```bash
sudo DOMINIO=hml.perfila.com.br bash 04-ambiente.sh hml
sudo DOMINIO=app.perfila.com.br bash 04-ambiente.sh prd
```

Cria diretorios, gera os segredos (uma unica vez, `0600`, fora do git), sobe o
Postgres do ambiente no localhost, registra o servico systemd com teto de
memoria e publica o vhost.

`MemoryMax` e `CPUWeight` sao o que impede o HML de derrubar o PRD numa maquina
so. Sem eles, um build em homologacao vira incidente em producao.

O script **nao sobrescreve** arquivo de segredo existente. Rodar de novo depois
de trocar o dominio atualiza vhost e unidade, e preserva senha e segredo.

Depois de rodar, preencha a chave da Anthropic:

```bash
sudo -u deploy nano /srv/valmer/prd/env/app.env    # ANTHROPIC_API_KEY=
sudo systemctl restart valmer-prd
```

- **Conferir**: `docker compose -f /srv/valmer/hml/postgres.compose.yml ps` diz
  `healthy`; `ss -ltnp | grep 5433` mostra `127.0.0.1` e nunca `0.0.0.0`;
  `curl -I http://hml.perfila.com.br` responde 502 (esperado, ainda nao ha
  deploy).
- **Desfazer**: `systemctl disable --now valmer-hml`,
  `rm /etc/nginx/sites-enabled/valmer-hml && systemctl reload nginx`,
  `docker compose -f .../postgres.compose.yml down` (com `-v` **apaga o banco**).

### Etapa 5 — TLS  *(obrigatoria antes de qualquer login real)*

O cookie de sessao do Better Auth e `secure` (ADR-0004): sem HTTPS o navegador
descarta o cookie e ninguem entra. TLS aqui nao e camada extra, e requisito de
funcionamento.

```bash
sudo certbot --nginx -d hml.perfila.com.br -d app.perfila.com.br \
  --agree-tos -m <email> --redirect --hsts
```

`--redirect` manda 80 para 443, `--hsts` adiciona o cabecalho. O timer de
renovacao do certbot ja vem instalado pelo pacote.

- **Conferir**: `curl -I http://hml...` responde 301; `curl -I https://hml...`
  traz `Strict-Transport-Security`; `sudo certbot renew --dry-run` passa.
  Renovacao automatica que nunca foi testada nao conta.
- **Desfazer**: `sudo certbot delete --cert-name hml.perfila.com.br` e
  restaurar o vhost com `sudo bash 04-ambiente.sh hml`.

### Etapa 6 — Primeiro deploy  *(obrigatoria)*

```bash
# caminho estavel, que o CI e os timers tambem usam
sudo install -d -m 755 /srv/valmer/bin
sudo install -m 750 /root/infra/*.sh /srv/valmer/bin/
sudo -u deploy bash /srv/valmer/bin/deploy.sh hml develop
```

O `deploy.sh` monta uma release nova em `releases/`, roda `npm ci` e
`npm run build`, aplica migracoes e **so entao** troca o symlink `current` e
reinicia o servico. Build quebrado nao derruba o que esta no ar. Ao final ele
copia os scripts para `/srv/valmer/bin`, que e de onde o CI e os timers passam
a chamar.

- **Conferir**: o proprio script confere — espera ate 60s por HTTP 200 em
  `127.0.0.1:3001` e, se nao vier, imprime o log e sai com erro. Depois:
  `curl -I https://hml.perfila.com.br` responde 200.
- **Desfazer**: `bash /srv/valmer/bin/deploy.sh rollback hml`.

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

| Situacao | Comando |
| --- | --- |
| Publicar em HML | push em `develop` (o CI faz), ou `bash /srv/valmer/bin/deploy.sh hml` |
| Publicar em PRD | merge em `master`, ou `bash /srv/valmer/bin/deploy.sh prd` |
| Voltar a versao anterior | `bash /srv/valmer/bin/deploy.sh rollback prd` |
| Backup manual | `bash /srv/valmer/bin/backup.sh prd` |
| Testar o restore | `bash /srv/valmer/bin/restore.sh hml` |
| Ver o log da app | `journalctl -u valmer-prd -f` |
| Ver o log do banco | `docker logs -f valmer_prd_db` |
| Estado geral | `bash /srv/valmer/bin/monitor.sh` |

### Rollback — o que ele devolve e o que nao devolve

`deploy.sh rollback` troca o symlink de volta e reinicia: segundos, e sempre
funciona, porque a release anterior continua inteira no disco.

**Ele devolve o codigo, nao o banco.** Se o deploy que voce esta desfazendo
rodou migracao, o schema continua o novo e o codigo antigo pode nao entender
mais as tabelas. Nesse caso o caminho e o dump que o proprio `deploy.sh` fez
antes de migrar:

```bash
bash /srv/valmer/bin/deploy.sh rollback prd
CONFIRMA=RESTAURAR-PRD bash /srv/valmer/bin/restore.sh prd /srv/valmer/prd/backups/<arquivo>.sql
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
sem senha, e o unico freio e `NODE_ENV === "production"`. Os dois servicos
declaram `Environment=NODE_ENV=production` explicitamente, e a variavel nao
existe em nenhum `app.env`. Nunca a coloque la, nem em HML.

**Segredos.** Vivem em `/srv/valmer/<amb>/env/*`, `0600`, dono `deploy`,
gerados na maquina. Nao estao no git, nao passam pelo GitHub, nao vao em `ARG`
de Dockerfile e nao aparecem em linha de comando — o `backup.sh` exporta
`PGPASSWORD` em vez de passar a URL como argumento, porque argumento de processo
aparece inteiro num `ps aux` para qualquer usuario da maquina.

**A string de conexao de producao nao e secret do GitHub.** O backup roda no
proprio servidor, dentro do `deploy.sh`. Um dump de producao carrega nome,
e-mail e resultado de assessment de gente real; ele nao passa pela
infraestrutura de terceiro nem vira artifact do Actions.

**Superficie minima.** So Nginx escuta em porta publica. Sem painel de
administracao de servidor, sem FTP, sem banco exposto, sem `default_server` do
Nginx respondendo por IP.

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
| 1 | Dominios de HML e PRD, e DNS apontando para o IP | Etapas 4 e 5 |
| 2 | Confirmar vCPU, RAM e disco reais (`nproc && free -h && df -h /`) | tetos da Etapa 4 |
| 3 | Chave da Anthropic no `app.env` de cada ambiente | geracao de narrativa |
| 4 | Destino off-site do backup (`rclone config`) | Etapa 7, e o deploy de PRD |
| 5 | Check no Healthchecks.io e `HEARTBEAT_URL` | Etapa 8 |
| 6 | Renomear `main` para `master` no GitHub e enviar a `develop` (ver abaixo) | o CI, que dispara nelas |
| 7 | Secrets de SSH no GitHub, por Environment `hml` e `prd` | deploy automatico |
| 8 | Variavel `DEPLOY_HABILITADO=true` nos Environments, quando a VPS existir | o job de deploy, que fica parado ate la |

Ate a pendencia 6 existir, o `deploy.sh` aceita ref explicita:
`bash deploy.sh hml main`.

### Branches — o estado hoje e o que falta

Remoto: `develop` (publicada, com todo o trabalho), `master` e `main` — as duas
ultimas no mesmo commit `8e8c98b`, o estado anterior ao app, com `main` ainda
marcada como padrao.

`master` nasceu de um `push origin main:master`, e nao do renomear do GitHub.
Na pratica da no mesmo, com uma perda: o renomear cria redirecionamento
automatico de links e PRs antigos, e o push nao. Como nao ha PR aberto e o
repositorio e novo, o custo e zero — mas fica registrado para ninguem procurar
um redirecionamento que nao existe.

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
  pela mesma tela.
