#!/usr/bin/env bash
# testar-infra.sh — o que da para conferir sem servidor nenhum.
#
#   bash scripts/infra/testar-infra.sh
#
# Nao substitui rodar as etapas na VPS. Pega o que quebra calado: sintaxe de
# shell e a leitura da DATABASE_URL, que decide onde o pg_dump vai bater. Uma
# porta lida errado faz o backup de producao dumpar homologacao sem reclamar.
set -euo pipefail

DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
falhas=0
checar() {
  if [ "$2" = "$3" ]; then
    echo "  ok   $1"
  else
    echo "  FALHA $1: esperado '$3', veio '$2'"; falhas=$((falhas + 1))
  fi
}

echo "sintaxe:"
for f in "$DIR"/*.sh; do
  bash -n "$f" && echo "  ok   $(basename "$f")"
done

echo "leitura da DATABASE_URL:"
. "$DIR/lib-pg.sh"

pg_conexao "postgres://valmer_prd:s3nh4@127.0.0.1:5432/valmer_prd"
checar "usuario"  "$PGUSER"     "valmer_prd"
checar "senha"    "$PGPASSWORD" "s3nh4"
checar "host"     "$PGHOST"     "127.0.0.1"
checar "porta"    "$PGPORT"     "5432"
checar "banco"    "$PGDATABASE" "valmer_prd"

# HML fica na 5433. Confundir as duas e dumpar o banco errado.
pg_conexao "postgres://valmer_hml:x@127.0.0.1:5433/valmer_hml"
checar "porta de hml" "$PGPORT" "5433"

# Senha com ':' e legitima e ja quebrou parser ingenuo.
pg_conexao "postgres://u:a:b@127.0.0.1:5432/d"
checar "senha com dois-pontos" "$PGPASSWORD" "a:b"

# Sem porta -> padrao do Postgres, e nao o host repetido.
pg_conexao "postgres://u:p@localhost/d"
checar "porta padrao" "$PGPORT" "5432"
checar "host sem porta" "$PGHOST" "localhost"

# Parametro na URL nao faz parte do nome do banco.
pg_conexao "postgres://u:p@h:5432/d?sslmode=require"
checar "banco com query" "$PGDATABASE" "d"

echo
[ "$falhas" -eq 0 ] && { echo "tudo certo."; exit 0; }
echo "$falhas falha(s)."; exit 1
