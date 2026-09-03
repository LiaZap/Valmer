#!/usr/bin/env bash
# lib-pg.sh — le a DATABASE_URL do ambiente e exporta o que o pg_dump/psql usam.
#
#   . lib-pg.sh && pg_conexao "$DATABASE_URL"
#
# A senha vai por variavel de ambiente, e nunca na linha de comando: argumento
# de processo aparece inteiro num `ps aux` para qualquer usuario da maquina, e
# essa e a senha do banco de producao.
#
# Testado por testar-infra.sh.

pg_conexao() {
  local url="${1:?pg_conexao: falta a DATABASE_URL}"
  local resto="${url#*://}"
  local cred="${resto%%@*}"
  local hostdb="${resto#*@}"
  local hostport="${hostdb%%/*}"
  local db="${hostdb#*/}"

  export PGUSER="${cred%%:*}"
  export PGPASSWORD="${cred#*:}"
  export PGHOST="${hostport%%:*}"
  # Sem porta na URL, o padrao do Postgres.
  case "$hostport" in
    *:*) export PGPORT="${hostport##*:}" ;;
    *)   export PGPORT=5432 ;;
  esac
  # Corta ?sslmode=... e afins, que fazem parte da URL e nao do nome do banco.
  export PGDATABASE="${db%%\?*}"
}
