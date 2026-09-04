#!/usr/bin/env bash
# monitor.sh — as quatro coisas que derrubam esta plataforma sem avisar.
#
#   bash monitor.sh          # roda as checagens e avisa se algo estiver ruim
#
# Verifica: disco cheio, servico caido, banco sem responder e certificado
# perto de vencer. Nao pretende ser observabilidade — pretende que alguem
# receba um e-mail antes do cliente ligar.
#
# Configuracao em /srv/valmer/monitor.env (0600):
#     HEARTBEAT_URL=https://hc-ping.com/<uuid>
#     CHECK_URLS="https://hml.perfila.com.br https://app.perfila.com.br"
#     CHECK_PG="127.0.0.1:5432 127.0.0.1:5433"
#     CHECK_UNITS="valmer-hml valmer-prd"      # vazio no caminho com painel
#
# Sem CHECK_* ele cai no padrao do caminho manual (systemd nas portas 3000/3001).
# Com EasyPanel (ADR-0006) nao ha unidade systemd da app nem porta fixa: preencha
# CHECK_URLS com os enderecos publicos e deixe CHECK_UNITS vazio.
#
# O HEARTBEAT_URL recebe um ping a cada rodada boa. Se a maquina morrer inteira, o silencio tambem
# dispara o alerta — que e o unico jeito de um monitor que roda na propria
# maquina avisar que a maquina caiu.
set -euo pipefail

PROBLEMAS=()
avisar() { PROBLEMAS+=("$1"); }

# A configuracao e lida antes das checagens: e ela que decide o que checar.
CHECK_URLS=""; CHECK_PG=""; CHECK_UNITS=""; HEARTBEAT_URL=""
[ -f /srv/valmer/monitor.env ] && { set -a; . /srv/valmer/monitor.env; set +a; }

# Padrao do caminho manual, para quem nunca configurou nada.
if [ -z "$CHECK_URLS$CHECK_PG$CHECK_UNITS" ]; then
  for amb in hml prd; do
    [ -d "/srv/valmer/$amb" ] || continue
    CHECK_UNITS="$CHECK_UNITS valmer-$amb"
    if [ "$amb" = "hml" ]; then
      CHECK_URLS="$CHECK_URLS http://127.0.0.1:3001/"; CHECK_PG="$CHECK_PG 127.0.0.1:5433"
    else
      CHECK_URLS="$CHECK_URLS http://127.0.0.1:3000/"; CHECK_PG="$CHECK_PG 127.0.0.1:5432"
    fi
  done
fi

# --- disco --------------------------------------------------------------------
uso="$(df --output=pcent / | tail -1 | tr -dc '0-9')"
[ "$uso" -ge 85 ] && avisar "disco em ${uso}% (limite 85%)"

# --- servicos, banco e app ----------------------------------------------------
for unidade in $CHECK_UNITS; do
  systemctl is-active --quiet "$unidade" || avisar "servico $unidade parado"
done

for alvo in $CHECK_PG; do
  pg_isready -q -h "${alvo%%:*}" -p "${alvo##*:}" || avisar "postgres em $alvo sem responder"
done

for url in $CHECK_URLS; do
  curl -fsS -o /dev/null --max-time 10 "$url" || avisar "sem resposta em $url"
done

# --- certificados -------------------------------------------------------------
# Conferido pela REDE, e nao lendo /etc/letsencrypt. Com o EasyPanel quem emite
# e o Traefik, que guarda tudo dentro de um acme.json proprio — a checagem por
# arquivo simplesmente nao acharia nada e passaria calada, que e pior do que
# nao existir. Pela rede vale para qualquer emissor.
# 14 dias de folga: da para consertar uma renovacao quebrada com calma.
for url in $CHECK_URLS; do
  case "$url" in https://*) ;; *) continue ;; esac
  hostp="${url#https://}"; hostp="${hostp%%/*}"
  host="${hostp%%:*}"
  if ! echo | openssl s_client -connect "$host:443" -servername "$host" 2>/dev/null        | openssl x509 -checkend $((14 * 86400)) -noout >/dev/null 2>&1; then
    avisar "certificado de $host vence em menos de 14 dias (ou nao pode ser lido)"
  fi
done

# --- resultado ----------------------------------------------------------------
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
