#!/usr/bin/env bash
# deploy.sh — publica uma versao, e desfaz.
#
#   Rodar como o usuario `deploy`, na VPS (o CI chama por SSH):
#     bash deploy.sh hml                 # ultimo commit de develop
#     bash deploy.sh prd                 # ultimo commit de master
#     bash deploy.sh prd v1.4.5          # uma tag ou SHA especifico
#     bash deploy.sh rollback prd        # volta para a versao anterior
#
# Cada deploy monta um diretorio novo em releases/ e so troca o symlink
# `current` quando o build passou. Build quebrado nao derruba o que esta no ar,
# e o rollback e trocar o symlink de volta — por isso ele e rapido e testavel.
set -euo pipefail

CMD="${1:-}"
info() { echo "[deploy] $*"; }
erro() { echo "[deploy] ERRO: $*" >&2; exit 1; }

# ------------------------------------------------------------------ rollback --
if [ "$CMD" = "rollback" ]; then
  AMB="${2:?uso: bash deploy.sh rollback <hml|prd>}"
  BASE="/srv/valmer/$AMB"
  ANTERIOR="$(cat "$BASE/.release-anterior" 2>/dev/null || true)"
  [ -n "$ANTERIOR" ] && [ -d "$ANTERIOR" ] || erro "nao ha release anterior guardada."

  ATUAL="$(readlink -f "$BASE/current")"
  ln -sfn "$ANTERIOR" "$BASE/current"
  echo "$ATUAL" > "$BASE/.release-anterior"
  sudo systemctl restart "valmer-$AMB"
  info "voltou para $(basename "$ANTERIOR")."
  cat <<'AVISO'

[deploy] ATENCAO — o rollback acima devolve o CODIGO, nao o BANCO.
  Se o deploy que voce esta desfazendo rodou migracao, o schema continua o novo
  e o codigo antigo pode nao entender mais as tabelas. Nesse caso o caminho e
  restaurar o dump feito antes do deploy:
      bash restore.sh <amb> <arquivo-do-backup>
AVISO
  exit 0
fi

# -------------------------------------------------------------------- deploy --
AMB="$CMD"
case "$AMB" in
  hml) PORTA=3001; REF_PADRAO=develop ;;
  prd) PORTA=3000; REF_PADRAO=master ;;
  *)   erro "uso: bash deploy.sh <hml|prd> [ref]  |  bash deploy.sh rollback <hml|prd>" ;;
esac

REF="${2:-$REF_PADRAO}"
REPO="${REPO:-https://github.com/LiaZap/Valmer.git}"
BASE="/srv/valmer/$AMB"
[ -d "$BASE" ] || erro "$BASE nao existe. Rode 04-ambiente.sh $AMB primeiro."

# --- codigo -------------------------------------------------------------------
if [ ! -d "$BASE/repo" ]; then
  git clone --bare "$REPO" "$BASE/repo"
fi
git -C "$BASE/repo" fetch --prune --tags origin '+refs/heads/*:refs/heads/*'
SHA="$(git -C "$BASE/repo" rev-parse --verify "$REF^{commit}" 2>/dev/null)" \
  || erro "ref '$REF' nao existe no repositorio."

RELEASE="$BASE/releases/$(date +%Y%m%d%H%M%S)-${SHA:0:7}"
mkdir -p "$RELEASE"
git -C "$BASE/repo" archive --format=tar "$SHA" | tar -x -C "$RELEASE"
info "release $(basename "$RELEASE") extraida de $REF ($(echo "$SHA" | cut -c1-7))."

# --- build --------------------------------------------------------------------
set -a; . "$BASE/env/app.env"; set +a   # DATABASE_URL, segredos — nunca em argv
cd "$RELEASE/perfila"
npm ci --no-audit --no-fund
npm run build

# --- banco --------------------------------------------------------------------
# Antes de mexer no schema de producao, um dump. A regra do projeto e essa e ela
# vale tambem para deploy manual, nao so para o que passa pelo CI.
if [ "$AMB" = "prd" ]; then
  bash "$(dirname "$(readlink -f "$0")")/backup.sh" prd
fi
npm run db:migrate

# --- troca --------------------------------------------------------------------
ATUAL="$(readlink -f "$BASE/current" 2>/dev/null || true)"
[ -n "$ATUAL" ] && echo "$ATUAL" > "$BASE/.release-anterior"
ln -sfn "$RELEASE" "$BASE/current"
sudo systemctl restart "valmer-$AMB"

# --- prova de vida ------------------------------------------------------------
ok=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORTA/"; then ok=1; break; fi
  sleep 2
done
if [ "$ok" -ne 1 ]; then
  echo "[deploy] a aplicacao nao respondeu em 60s. Ultimas linhas do log:" >&2
  journalctl -u "valmer-$AMB" -n 40 --no-pager >&2 || true
  erro "deploy NAO confirmado. Desfaca com: bash deploy.sh rollback $AMB"
fi

# --- scripts de operacao ------------------------------------------------------
# O CI e os timers chamam sempre /srv/valmer/bin/*.sh, um caminho estavel. Aqui
# ele e atualizado a partir da release que acabou de passar: o repositorio segue
# sendo a fonte da verdade, e ninguem depende de um symlink que ainda nao existe
# no primeiro deploy. Os scripts recebem o ambiente por argumento, entao a copia
# serve HML e PRD igualmente.
# `mv` troca o inode: o deploy.sh rodando agora continua intacto ate terminar.
# Copiar por cima de um script em uso corrompe a execucao no meio.
mkdir -p /srv/valmer/bin
for s in "$RELEASE"/scripts/infra/*.sh; do
  nome="$(basename "$s")"
  cp "$s" "/srv/valmer/bin/.tmp-$nome"
  chmod 750 "/srv/valmer/bin/.tmp-$nome"
  mv -f "/srv/valmer/bin/.tmp-$nome" "/srv/valmer/bin/$nome"
done

# --- limpeza ------------------------------------------------------------------
# Guarda as 3 ultimas. Disco cheio derruba a maquina inteira, e release velha e
# o lixo que mais cresce sozinho.
ls -1dt "$BASE/releases"/*/ 2>/dev/null | tail -n +4 | while read -r velha; do
  [ "$(readlink -f "$velha")" = "$(readlink -f "$BASE/current")" ] && continue
  [ "$(readlink -f "$velha")" = "$(cat "$BASE/.release-anterior" 2>/dev/null)" ] && continue
  rm -rf "$velha"
done

info "no ar: $AMB @ $(basename "$RELEASE")"
info "desfazer: bash deploy.sh rollback $AMB"
