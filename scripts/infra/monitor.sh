#!/usr/bin/env bash
# monitor.sh — as quatro coisas que derrubam esta plataforma sem avisar.
#
#   bash monitor.sh          # roda as checagens e avisa se algo estiver ruim
#
# Verifica: disco cheio, servico caido, banco sem responder e certificado
# perto de vencer. Nao pretende ser observabilidade — pretende que alguem
# receba um e-mail antes do cliente ligar.
#
# Alerta em /srv/valmer/monitor.env (0600):
#     HEARTBEAT_URL=https://hc-ping.com/<uuid>
# Um ping a cada rodada boa. Se a maquina morrer inteira, o silencio tambem
# dispara o alerta — que e o unico jeito de um monitor que roda na propria
# maquina avisar que a maquina caiu.
set -euo pipefail

PROBLEMAS=()
avisar() { PROBLEMAS+=("$1"); }

# --- disco --------------------------------------------------------------------
uso="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
[ "$uso" -ge 85 ] && avisar "disco em ${uso}% (limite 85%)"

# --- servicos, banco e app ----------------------------------------------------
for amb in hml prd; do
  [ -d "/srv/valmer/$amb" ] || continue
  porta_app=3000; [ "$amb" = "hml" ] && porta_app=3001
  porta_pg=5432;  [ "$amb" = "hml" ] && porta_pg=5433

  systemctl is-active --quiet "valmer-$amb" || avisar "servico valmer-$amb parado"
  pg_isready -q -h 127.0.0.1 -p "$porta_pg" || avisar "postgres de $amb sem responder"
  curl -fsS -o /dev/null --max-time 10 "http://127.0.0.1:$porta_app/" \
    || avisar "app de $amb nao respondeu na porta $porta_app"
done

# --- certificados -------------------------------------------------------------
# 14 dias e folga suficiente para consertar uma renovacao quebrada com calma.
for cert in /etc/letsencrypt/live/*/cert.pem; do
  [ -f "$cert" ] || continue
  dominio="$(basename "$(dirname "$cert")")"
  openssl x509 -in "$cert" -checkend $((14 * 86400)) -noout >/dev/null \
    || avisar "certificado de $dominio vence em menos de 14 dias"
done

# --- resultado ----------------------------------------------------------------
HEARTBEAT_URL=""
[ -f /srv/valmer/monitor.env ] && { set -a; . /srv/valmer/monitor.env; set +a; }

if [ ${#PROBLEMAS[@]} -eq 0 ]; then
  echo "[monitor] tudo certo."
  [ -n "$HEARTBEAT_URL" ] && curl -fsS -m 10 -o /dev/null "$HEARTBEAT_URL" || true
  exit 0
fi

texto="$(printf '%s\n' "${PROBLEMAS[@]}")"
echo "[monitor] PROBLEMAS:"; echo "$texto"
[ -n "$HEARTBEAT_URL" ] && curl -fsS -m 10 -o /dev/null --data-raw "$texto" \
  "$HEARTBEAT_URL/fail" || true
exit 1
