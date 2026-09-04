#!/usr/bin/env bash
# backup.sh — dump do Postgres, conferido e mandado para fora da maquina.
#
#   bash backup.sh hml
#   bash backup.sh prd
#
# Roda no host (usa o postgresql-client-16 instalado pelo 03-runtime.sh).
# O destino off-site fica em /srv/valmer/<amb>/env/backup.env:
#     BACKUP_REMOTE=gdrive:valmer/prd        # qualquer remote de `rclone config`
#
# Backup que nunca saiu do servidor nao e backup: se o disco vai, ele vai junto.
# Por isso PRD sem destino off-site falha de proposito.
set -euo pipefail

AMB="${1:?uso: bash backup.sh <hml|prd>}"
BASE="/srv/valmer/$AMB"
[ -d "$BASE" ] || { echo "erro: $BASE nao existe."; exit 1; }
info() { echo "[backup-$AMB] $*"; }

# --- conexao ------------------------------------------------------------------
# A senha vai por variavel de ambiente, e nao na linha de comando: argumento de
# processo aparece inteiro num `ps aux` para qualquer usuario da maquina.
# Com EasyPanel (ADR-0006) as variaveis vivem no painel e nao ha app.env no
# disco: quem quiser backup precisa deixar a DATABASE_URL em backup.env. No
# caminho manual o app.env ja tem tudo. Os dois servem, nesta ordem.
set -a
[ -f "$BASE/env/app.env" ]    && . "$BASE/env/app.env"
[ -f "$BASE/env/backup.env" ] && . "$BASE/env/backup.env"
set +a
[ -n "${DATABASE_URL:-}" ] || {
  echo "erro: DATABASE_URL nao encontrada em $BASE/env/{app,backup}.env" >&2
  exit 1
}
. "$(dirname "$(readlink -f "$0")")/lib-pg.sh"
pg_conexao "$DATABASE_URL"

DESTINO="$BASE/backups"
ARQUIVO="$DESTINO/backup_$(date +%d_%m_%Y_%H_%M).sql"
mkdir -p "$DESTINO/semanal"

pg_dump --no-owner --no-acl --clean --if-exists --file="$ARQUIVO"

# --- conferencia --------------------------------------------------------------
# Dump vazio "com sucesso" e a falha classica de DR: so aparece no dia do
# restore. Duas checagens baratas resolvem.
bytes="$(wc -c < "$ARQUIVO")"
[ "$bytes" -ge 1024 ] || { echo "erro: dump com $bytes bytes, suspeito."; exit 1; }
grep -q 'PostgreSQL database dump' "$ARQUIVO" || { echo "erro: nao parece um dump."; exit 1; }
chmod 600 "$ARQUIVO"
info "$(basename "$ARQUIVO") — $((bytes / 1024)) KB, conferido."

# Domingo vira copia semanal, que vive mais tempo.
[ "$(date +%u)" = "7" ] && cp -p "$ARQUIVO" "$DESTINO/semanal/"

# --- fora da maquina ----------------------------------------------------------
if [ -n "${BACKUP_REMOTE:-}" ]; then
  rclone copy "$ARQUIVO" "$BACKUP_REMOTE/" --no-traverse
  info "copiado para $BACKUP_REMOTE."
elif [ "$AMB" = "prd" ]; then
  echo "erro: BACKUP_REMOTE nao configurado em $BASE/env/backup.env." >&2
  echo "      Producao sem copia off-site nao tem backup, tem arquivo." >&2
  exit 1
else
  info "sem destino off-site (aceitavel em HML)."
fi

# --- retencao -----------------------------------------------------------------
find "$DESTINO" -maxdepth 1 -name 'backup_*.sql' -mtime +30 -delete
find "$DESTINO/semanal" -name 'backup_*.sql' -mtime +90 -delete
info "retencao: diario 30d, semanal 90d."
