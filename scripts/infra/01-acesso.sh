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
# O deploy NAO entra no grupo sudo. Ele recebe abaixo so o que precisa.
gpasswd -d "$DEPLOY_USER" sudo >/dev/null 2>&1 || true

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
  cat > /etc/systemd/system/ssh.socket.d/porta.conf <<EOF
[Socket]
ListenStream=
ListenStream=$SSH_PORT
EOF
  systemctl daemon-reload
  info "porta do SSH definida em $SSH_PORT (ssh.socket)."
fi

# --- endurecimento do sshd ----------------------------------------------------
if [ ! -s "$admin_keys" ]; then
  info "AVISO: $ADMIN_USER esta SEM chave publica."
  info "Senha e login de root continuam ligados de proposito."
  info "Instale a chave e rode este script de novo:"
  info "  ssh-copy-id -p $SSH_PORT $ADMIN_USER@<ip>"
else
  cat > /etc/ssh/sshd_config.d/99-valmer.conf <<EOF
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
  info "senha desligada, root sem login direto, acesso so por chave."
fi

# --- fail2ban -----------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y fail2ban >/dev/null
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

echo
info "PRONTO. NAO FECHE ESTA SESSAO ainda."
info "Abra um terminal NOVO e confirme que entra:"
info "  ssh -p $SSH_PORT $ADMIN_USER@<ip>"
info "So depois disso feche a sessao de root."
