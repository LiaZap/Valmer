#!/usr/bin/env bash
# valmer.sh — o que fica FORA do painel.
#
#   valmer            lista tudo o que da para fazer
#   valmer status     o que esta de pe agora, e a checagem de saude
#   valmer db <amb>   abrir o psql no banco do ambiente
#   valmer ps         containers
#
# Log, variavel de ambiente, deploy e rollback estao no EasyPanel (ADR-0006), e
# nao aqui: ter os dois seria ter duas verdades. O que sobrou neste script e de
# proposito o que NAO pode depender do painel estar de pe — se ele cair, backup,
# restore e diagnostico continuam funcionando por SSH.
set -euo pipefail

BIN="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

ambiente() {
  case "${1:-}" in
    hml|prd) echo "$1" ;;
    *) echo "erro: diga o ambiente — hml ou prd." >&2; exit 1 ;;
  esac
}

case "${1:-ajuda}" in

  status)
    echo "== containers =="
    docker ps --format '  {{.Names}}  {{.Status}}' | head -20
    echo "== disco =="
    df -h / | tail -1 | awk '{print "  " $3 " usados de " $2 " (" $5 ")"}'
    echo "== ultimo backup =="
    for a in hml prd; do
      f="$(ls -1t "/srv/valmer/$a/backups"/backup_*.sql 2>/dev/null | head -1)"
      [ -n "$f" ] && printf "  %-4s %s\n" "$a" "$(basename "$f")" \
                  || printf "  %-4s nenhum\n" "$a"
    done
    echo "== checagem =="
    bash "$BIN/monitor.sh" || true
    ;;

  db)
    amb="$(ambiente "${2:-}")"
    # A DATABASE_URL vem do backup.env, que e a copia que vive fora do painel
    # justamente para o dia em que o painel nao abrir.
    set -a; . "/srv/valmer/$amb/env/backup.env"; set +a
    . "$BIN/lib-pg.sh"; pg_conexao "$DATABASE_URL"
    echo "psql em $PGDATABASE ($amb). \\q para sair."
    psql
    ;;

  ps)
    docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    ;;

  *)
    cat <<'AJUDA'
valmer — o que fica fora do painel

  valmer status         containers, disco, ultimo backup, checagem de saude
  valmer db <amb>       psql no banco do ambiente
  valmer ps             containers, com portas

  bash /srv/valmer/bin/backup.sh <amb>            dump agora, conferido
  bash /srv/valmer/bin/restore.sh hml             testar o restore (mensal)
  bash /srv/valmer/bin/monitor.sh                 so a checagem

No EasyPanel: deploy, rollback, log da aplicacao, variaveis de ambiente e
reinicio de servico. Nao ha comando equivalente aqui de proposito — dois
caminhos para publicar e o mesmo que nenhum.

Antes de mergear em master, o backup de PRD e manual: o painel nao faz sozinho.
AJUDA
    ;;
esac
