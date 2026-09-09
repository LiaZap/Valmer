#!/usr/bin/env bash
# 01-acesso.sh — quem entra na maquina, e como.
#
#   Rodar COMO ROOT, na VPS, antes de qualquer outra coisa.
#   ADMIN_USER=paulo SSH_PORT=2222 bash 01-acesso.sh
#
# Cria o usuario administrador (com sudo), o usuario `deploy` (sem sudo, so
# reinicia os servicos da app), muda a porta do SSH, desliga senha, tira o login
# direto de root e instala o fail2ban.
#
# TRAVA: nao desliga senha nem login de root enquanto o administrador nao tiver
# uma chave publica instalada. Ficar do lado de fora da propria maquina e o jeito
# mais comum de estragar este passo.
#
# Idempotente: rodar duas vezes nao quebra o que ja esta certo.
set -euo pipefail

ADMIN_USER="${ADMIN_USER:-paulo}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
SSH_PORT="${SSH_PORT:-22}"

[ "$(id -u)" -eq 0 ] || { echo "erro: rode como root."; exit 1; }

info() { echo "[01-acesso] $*"; }

# --- usuarios -----------------------------------------------------------------
for u in "$ADMIN_USER" "$DEPLOY_USER"; do
  if id "$u" >/dev/null 2>&1; then
    info "usuario $u ja existe."
  else
    adduser --disabled-password --gecos "" "$u"
    info "usuario $u criado."
  fi
  install -d -m 700 -o "$u" -g "$u" "/home/$u/.ssh"
  touch "/home/$u/.ssh/authorized_keys"
  chmod 600 "/home/$u/.ssh/authorized_keys"
  chown "$u:$u" "/home/$u/.ssh/authorized_keys"
done

usermod -aG sudo "$ADMIN_USER"
# `adm` da leitura do journal sem sudo. Diagnostico nao devia exigir elevacao:
# quem precisa de `sudo journalctl` para ver um log acaba usando `sudo` para
# tudo, e o sudo com senha vira formalidade. Leitura de log e so leitura.
usermod -aG adm "$ADMIN_USER"
# O deploy NAO entra no grupo sudo. Ele recebe abaixo so o que precisa. E nao
# entra em `docker` aqui: quem esta no grupo docker tem root na maquina sem
# senha nenhuma. O 03-runtime coloca so o deploy, que precisa subir o Postgres.
gpasswd -d "$DEPLOY_USER" sudo >/dev/null 2>&1 || true

# --- senha local do administrador ---------------------------------------------
# Sao duas coisas diferentes, e trata-las como uma quebra o usuario: o SSH entra
# por chave (PasswordAuthentication no, mais abaixo), mas o `sudo` pede senha
# LOCAL. Criado com --disabled-password e no grupo sudo, o administrador fica
# com sudo inutilizavel: pergunta uma senha que nao existe e nega tres vezes.
# Chave para entrar + senha para elevar e a configuracao certa, nao um descuido.
if [ "$(passwd -S "$ADMIN_USER" | awk '{print $2}')" != "P" ]; then
  if [ -t 0 ]; then
    info "$ADMIN_USER ainda nao tem senha local, e sem ela o sudo nao funciona."
    info "Defina uma agora (ela NAO serve para entrar por SSH):"
    passwd "$ADMIN_USER"
  else
    info "AVISO: $ADMIN_USER sem senha local — o sudo dele nao vai funcionar."
    info "       Rode como root:  passwd $ADMIN_USER"
  fi
fi

# Herda a chave com que voce entrou como root, se o admin ainda nao tem nenhuma.
# Sem isto o proximo passo trava (e e para travar mesmo).
admin_keys="/home/$ADMIN_USER/.ssh/authorized_keys"
if [ ! -s "$admin_keys" ] && [ -s /root/.ssh/authorized_keys ]; then
  cat /root/.ssh/authorized_keys > "$admin_keys"
  chown "$ADMIN_USER:$ADMIN_USER" "$admin_keys"
  chmod 600 "$admin_keys"
  info "chave de root copiada para $ADMIN_USER."
fi

# --- sudo restrito do deploy --------------------------------------------------
# O deploy reinicia a app e le o status. Nada alem disso. Sem NOPASSWD geral,
# sem ALL=(ALL).
cat > /etc/sudoers.d/valmer-deploy <<EOF
# Gerado por scripts/infra/01-acesso.sh — nao editar a mao.
Cmnd_Alias VALMER_SVC = /usr/bin/systemctl restart valmer-hml, \\
                        /usr/bin/systemctl restart valmer-prd, \\
                        /usr/bin/systemctl reload  valmer-hml, \\
                        /usr/bin/systemctl reload  valmer-prd, \\
                        /usr/bin/systemctl status  valmer-hml, \\
                        /usr/bin/systemctl status  valmer-prd, \\
                        /usr/bin/systemctl is-active valmer-hml, \\
                        /usr/bin/systemctl is-active valmer-prd
$DEPLOY_USER ALL=(root) NOPASSWD: VALMER_SVC
EOF
chmod 440 /etc/sudoers.d/valmer-deploy
# sudoers quebrado deixa a maquina sem sudo nenhum. Conferir antes de confiar.
if ! visudo -cf /etc/sudoers.d/valmer-deploy >/dev/null; then
  rm -f /etc/sudoers.d/valmer-deploy
  echo "erro: sudoers invalido, arquivo removido."; exit 1
fi
info "sudo do $DEPLOY_USER limitado aos servicos valmer-*."

# --- porta do SSH -------------------------------------------------------------
# No Ubuntu 24.04 o sshd sobe por socket activation: mudar `Port` no
# sshd_config nao tem efeito nenhum. Quem manda e o ssh.socket.
if [ "$SSH_PORT" != "22" ]; then
  install -d -m 755 /etc/systemd/system/ssh.socket.d
  # As duas familias, explicitas. `ListenStream=$SSH_PORT` sozinho cria um
  # socket [::] e conta com o kernel aceitar IPv4 mapeado — o que depende de
  # net.ipv6.bindv6only=0. Nesta imagem nao esta, e o resultado foi sshd
  # escutando so em IPv6: de fora, connection refused em IPv4, com o `ss`
  # mostrando LISTEN e parecendo tudo certo.
  cat > /etc/systemd/system/ssh.socket.d/porta.conf <<EOF
[Socket]
ListenStream=
ListenStream=0.0.0.0:$SSH_PORT
ListenStream=[::]:$SSH_PORT
EOF
  systemctl daemon-reload
  info "porta do SSH definida em $SSH_PORT (ssh.socket)."
elif [ -e /etc/systemd/system/ssh.socket.d/porta.conf ]; then
  # Voltar para 22 tem que ser tao possivel quanto sair dele. Sem este ramo o
  # script so sabia andar para um lado: rodar com SSH_PORT=22 deixava o
  # override antigo no disco e a porta nao voltava, o que e o oposto de
  # idempotente. Descoberto na pratica, quando a porta alta foi bloqueada
  # fora da maquina e nao havia caminho de volta pelo proprio script.
  rm -rf /etc/systemd/system/ssh.socket.d
  systemctl daemon-reload
  info "override de porta removido, SSH volta para 22."
fi

# --- endurecimento do sshd ----------------------------------------------------
if [ ! -s "$admin_keys" ]; then
  info "AVISO: $ADMIN_USER esta SEM chave publica."
  info "Senha e login de root continuam ligados de proposito."
  info "Instale a chave e rode este script de novo:"
  info "  ssh-copy-id -p $SSH_PORT $ADMIN_USER@<ip>"
else
  # O PREFIXO IMPORTA, e custou um susto: o sshd usa o PRIMEIRO valor de cada
  # palavra-chave, e o `Include` do sshd_config le sshd_config.d/*.conf em
  # ordem alfabetica. A imagem vem com `50-cloud-init.conf` contendo
  # `PasswordAuthentication yes`; um arquivo nosso chamado 99- e lido DEPOIS e
  # perde. O resultado era o pior possivel: o script dizia "senha desligada" e
  # a senha continuava aceitando login. Por isso 10-, que vem antes de tudo.
  rm -f /etc/ssh/sshd_config.d/99-valmer.conf
  cat > /etc/ssh/sshd_config.d/10-valmer.conf <<EOF
# Gerado por scripts/infra/01-acesso.sh — nao editar a mao.
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
X11Forwarding no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers $ADMIN_USER $DEPLOY_USER
EOF
  sshd -t
  systemctl restart ssh.socket 2>/dev/null || true
  systemctl restart ssh

  # Escrever o arquivo nao e o mesmo que ele valer. `sshd -T` imprime a
  # configuracao EFETIVA, ja resolvida entre todos os includes: e a unica
  # leitura que prova qual valor ganhou. Falhar aqui, com a sessao de root
  # ainda aberta, e melhor que descobrir de fora que a senha nunca desligou.
  efetivo="$(sshd -T 2>/dev/null || true)"
  faltou=""
  echo "$efetivo" | grep -qx 'passwordauthentication no' || faltou="PasswordAuthentication"
  echo "$efetivo" | grep -qx 'permitrootlogin no' || faltou="${faltou:+$faltou e }PermitRootLogin"
  if [ -n "$faltou" ]; then
    echo "erro: $faltou nao pegou na configuracao efetiva do sshd." >&2
    echo "      Algum arquivo em /etc/ssh/sshd_config.d/ e lido antes do nosso." >&2
    echo "      NAO feche esta sessao. Conferir:" >&2
    echo "        ls /etc/ssh/sshd_config.d/ && sshd -T | grep -Ei 'passwordauth|permitroot'" >&2
    exit 1
  fi
  info "senha desligada, root sem login direto, acesso so por chave."
  info "conferido em sshd -T, e nao so no arquivo escrito."
fi

# --- fail2ban -----------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
# Maquina recem-instalada dispara unattended-upgrades sozinha no primeiro boot e
# segura o lock do dpkg por minutos. Sem o Lock::Timeout o apt falha na hora, e
# com `set -e` o script morre aqui — depois de ja ter mexido no sshd, que e o
# pior lugar para parar no meio. O apt espera; nos nao reimplementamos espera.
apt-get -o DPkg::Lock::Timeout=300 update -qq
apt-get -o DPkg::Lock::Timeout=300 install -y fail2ban >/dev/null
# A imagem 24.04 nao instala rsyslog: nao existe /var/log/auth.log e a jail
# padrao morre calada. Ler do journal e o que funciona aqui.
cat > /etc/fail2ban/jail.d/valmer-sshd.conf <<EOF
[sshd]
enabled  = true
backend  = systemd
port     = $SSH_PORT
maxretry = 5
findtime = 10m
bantime  = 1h
EOF
systemctl enable --now fail2ban >/dev/null
systemctl restart fail2ban
info "fail2ban ativo na porta $SSH_PORT."

# --- prova de que a porta atende nas duas familias -----------------------------
# `LISTEN` no `ss` nao basta: um socket so-IPv6 aparece igualzinho e recusa
# todo IPv4. Conferir as duas, e falhar aqui, e melhor que descobrir do lado
# de fora com a sessao antiga ja fechada.
faltou=""
ss -tln | grep -q "0\.0\.0\.0:$SSH_PORT " || faltou="IPv4"
ss -tln | grep -q "\[::\]:$SSH_PORT "      || faltou="${faltou:+$faltou e }IPv6"
if [ -n "$faltou" ]; then
  echo "erro: sshd nao esta escutando em $SSH_PORT sobre $faltou." >&2
  echo "      NAO feche esta sessao. Conferir: ss -tlnp | grep $SSH_PORT" >&2
  exit 1
fi
info "sshd escutando em $SSH_PORT, IPv4 e IPv6."

echo
info "PRONTO. NAO FECHE ESTA SESSAO ainda."
info "Abra um terminal NOVO e confirme que entra:"
info "  ssh -p $SSH_PORT $ADMIN_USER@<ip>"
info "So depois disso feche a sessao de root."
