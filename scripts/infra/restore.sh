#!/usr/bin/env bash
# restore.sh — devolve um dump ao banco, e confere que voltou de verdade.
#
#   bash restore.sh hml                                   # ultimo dump de HML
#   bash restore.sh hml /srv/valmer/prd/backups/backup_03_09_2026_02_00.sql
#   CONFIRMA=RESTAURAR-PRD bash restore.sh prd <arquivo>  # producao, so assim
#
# Este script existe para ser rodado em HML DE PROPOSITO, uma vez por mes.
# Backup sem restore testado e uma suposicao, nao um backup — e a hora de
# descobrir que o dump esta ruim nao e o dia do incidente.
set -euo pipefail

AMB="${1:?uso: bash restore.sh <hml|prd> [arquivo]}"
BASE="/srv/valmer/$AMB"
[ -d "$BASE" ] || { echo "erro: $BASE nao existe."; exit 1; }
info() { echo "[restore-$AMB] $*"; }

if [ "$AMB" = "prd" ] && [ "${CONFIRMA:-}" != "RESTAURAR-PRD" ]; then
  echo "erro: restaurar producao apaga os dados de agora." >&2
  echo "      Se e isso mesmo: CONFIRMA=RESTAURAR-PRD bash restore.sh prd <arquivo>" >&2
  exit 1
fi

ARQUIVO="${2:-$(ls -1t "$BASE/backups"/backup_*.sql 2>/dev/null | head -1)}"
[ -n "$ARQUIVO" ] && [ -f "$ARQUIVO" ] || { echo "erro: dump nao encontrado."; exit 1; }
grep -q 'PostgreSQL database dump' "$ARQUIVO" || { echo "erro: nao parece um dump."; exit 1; }

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

# O app segurando conexao atrapalha o DROP do `--clean`. Para, restaura, sobe.
sudo systemctl stop "valmer-$AMB" 2>/dev/null || true

info "restaurando $(basename "$ARQUIVO") em $PGDATABASE..."
psql --set ON_ERROR_STOP=on --quiet --file="$ARQUIVO"

# --- prova de que voltou ------------------------------------------------------
# Restore que termina sem erro e banco vazio ja aconteceu com todo mundo.
tabelas="$(psql -tAc "select count(*) from information_schema.tables where table_schema='public'")"
usuarios="$(psql -tAc "select count(*) from usuarios where is_deleted = false")"
info "tabelas: $tabelas | usuarios ativos: $usuarios"
[ "$tabelas" -ge 5 ] || { echo "erro: schema restaurado parece incompleto."; exit 1; }

sudo systemctl start "valmer-$AMB" 2>/dev/null || true
info "restore concluido e conferido."
