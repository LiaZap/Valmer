#!/usr/bin/env bash
# 05-agendamentos.sh — o que precisa acontecer sozinho, todo dia.
#
#   Rodar COMO ROOT, depois que os ambientes existem.
#   bash 05-agendamentos.sh
#
# Instala timers do systemd (nao cron: o systemd ja esta ai, guarda o log no
# journal e mostra a proxima execucao com `systemctl list-timers`).
#
#   valmer-backup@prd   diario 02:00 (+ ate 10min de folga aleatoria)
#   valmer-backup@hml   diario 02:00 (a folga aleatoria separa os dois)
#   valmer-monitor      a cada 10 minutos
#
# Idempotente.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "erro: rode como root."; exit 1; }
DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
BIN=/srv/valmer/bin
info() { echo "[05-agendamentos] $*"; }

# Os timers apontam para /srv/valmer/bin, que o deploy.sh mantem atualizado a
# cada publicacao. Aqui so garantimos que ele exista antes do primeiro deploy.
install -d -m 755 "$BIN"
if [ "$DIR" != "$BIN" ]; then
  install -m 750 "$DIR"/*.sh "$BIN/"
  info "scripts copiados para $BIN."
fi

# `valmer` a partir de qualquer diretorio, para ninguem precisar decorar
# caminho — e essa e a unica coisa que um painel web daria de util aqui.
ln -sfn "$BIN/valmer.sh" /usr/local/bin/valmer
info "comando 'valmer' disponivel."

# --- backup (uma unidade parametrizada serve os dois ambientes) ----------------
cat > /etc/systemd/system/valmer-backup@.service <<EOF
[Unit]
Description=Backup do Postgres — %i
After=docker.service

[Service]
Type=oneshot
User=$DEPLOY_USER
ExecStart=/usr/bin/bash /srv/valmer/bin/backup.sh %i
EOF

cat > /etc/systemd/system/valmer-backup@.timer <<'EOF'
[Unit]
Description=Backup diario do Postgres — %i

[Timer]
OnCalendar=*-*-* 02:00:00
RandomizedDelaySec=10m
Persistent=true

[Install]
WantedBy=timers.target
EOF

# --- monitor ------------------------------------------------------------------
cat > /etc/systemd/system/valmer-monitor.service <<EOF
[Unit]
Description=Checagem de saude da plataforma

[Service]
Type=oneshot
ExecStart=/usr/bin/bash /srv/valmer/bin/monitor.sh
EOF

cat > /etc/systemd/system/valmer-monitor.timer <<'EOF'
[Unit]
Description=Checagem de saude a cada 10 minutos

[Timer]
OnBootSec=5min
OnUnitActiveSec=10min

[Install]
WantedBy=timers.target
EOF

# --- rotacao de log -----------------------------------------------------------
# O journal cresce ate encher o disco se ninguem disser o limite. 500 MB e
# folgado para esta aplicacao e evita que log derrube o servidor.
mkdir -p /etc/systemd/journald.conf.d
cat > /etc/systemd/journald.conf.d/valmer.conf <<'EOF'
[Journal]
SystemMaxUse=500M
MaxRetentionSec=30day
EOF
systemctl restart systemd-journald

systemctl daemon-reload
systemctl enable --now valmer-backup@prd.timer >/dev/null 2>&1 || \
  info "aviso: ambiente prd ainda nao existe, timer de backup nao ativado."
systemctl enable --now valmer-backup@hml.timer >/dev/null 2>&1 || \
  info "aviso: ambiente hml ainda nao existe, timer de backup nao ativado."
systemctl enable --now valmer-monitor.timer >/dev/null

info "agendado."
echo
info "Conferir:  systemctl list-timers 'valmer-*'"
info "Testar agora, sem esperar o horario:"
info "  systemctl start valmer-backup@hml.service && journalctl -u valmer-backup@hml -n 20"
info "  systemctl start valmer-monitor.service   && journalctl -u valmer-monitor  -n 20"
info "Desfazer:  systemctl disable --now valmer-backup@{hml,prd}.timer valmer-monitor.timer"
