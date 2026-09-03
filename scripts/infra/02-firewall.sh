#!/usr/bin/env bash
# 02-firewall.sh — fecha a maquina por padrao.
#
#   Rodar COMO ROOT, depois do 01 e depois de confirmar que o SSH novo funciona.
#   bash 02-firewall.sh
#
# Regra: nega tudo que entra, libera 80, 443 e a porta do SSH. Postgres nao
# aparece aqui porque ele nao deve escutar em interface publica nenhuma — ver
# nota sobre Docker no fim do arquivo.
#
# Idempotente.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "erro: rode como root."; exit 1; }
info() { echo "[02-firewall] $*"; }

# A porta vem do que o 01 configurou, e nao de uma segunda copia da verdade.
SSH_PORT="$(awk -F= '/^ListenStream=[0-9]+$/{p=$2} END{print p}' \
  /etc/systemd/system/ssh.socket.d/porta.conf 2>/dev/null || true)"
SSH_PORT="${SSH_PORT:-22}"
info "porta de SSH detectada: $SSH_PORT"

DEBIAN_FRONTEND=noninteractive apt-get install -y ufw >/dev/null

ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw limit "$SSH_PORT"/tcp comment "SSH"
ufw allow 80/tcp  comment "HTTP (redireciona p/ 443)"
ufw allow 443/tcp comment "HTTPS"
ufw --force enable

info "regras aplicadas:"
ufw status verbose

cat <<'NOTA'

[02-firewall] Ponto que costuma passar batido:
  O Docker escreve direto no iptables e uma porta publicada com
  `-p 5432:5432` FURA o UFW — a regra de deny nao ve esse trafego.
  Por isso todo compose deste projeto publica como "127.0.0.1:PORTA:5432".
  Se alguem trocar por "PORTA:5432", o Postgres vai para a internet mesmo
  com o firewall fechado. Conferir com:
      ss -ltnp | grep 5432      # tem que aparecer 127.0.0.1, nunca 0.0.0.0

[02-firewall] Desfazer:  ufw disable
NOTA
