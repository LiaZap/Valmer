#!/usr/bin/env bash
# valmer.sh — o painel de controle, em linha de comando.
#
#   valmer                     lista tudo o que da para fazer
#   valmer status              o que esta de pe agora
#   valmer logs prd            log da aplicacao (-f para acompanhar)
#   valmer env prd             editar variaveis de ambiente e reiniciar
#   valmer db hml              abrir o psql no banco do ambiente
#   valmer restart prd
#   valmer ps                  containers
#
# Existe para dar o que um painel web daria — saber o que fazer sem decorar
# caminho — sem colocar uma UI com acesso ao socket do Docker na internet.
#
# Publicar e desfazer NAO estao aqui de proposito: sao `deploy.sh`, e ter dois
# caminhos para publicar e como nao ter nenhum. Este script so aponta para ele.
set -euo pipefail

BIN="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"

ambiente() {
  case "${1:-}" in
    hml|prd) echo "$1" ;;
    *) echo "erro: diga o ambiente — hml ou prd." >&2; exit 1 ;;
  esac
}

# Os arquivos de env pertencem ao `deploy` e sao 0600. Quem chama como outro
# usuario passa por sudo; o proprio deploy edita direto.
como_deploy() {
  if [ "$(id -un)" = "deploy" ]; then "$@"; else sudo -u deploy "$@"; fi
}

case "${1:-ajuda}" in

  status)
    echo "== servicos =="
    for a in hml prd; do
      [ -d "/srv/valmer/$a" ] || continue
      printf "  valmer-%-4s %s\n" "$a" "$(systemctl is-active "valmer-$a" 2>/dev/null || echo ausente)"
    done
    echo "== containers =="
    docker ps --filter name=valmer_ --format '  {{.Names}}  {{.Status}}'
    echo "== disco =="
    df -h / | tail -1 | awk '{print "  " $3 " usados de " $2 " (" $5 ")"}'
    echo "== checagem =="
    bash "$BIN/monitor.sh" || true
    ;;

  logs)
    amb="$(ambiente "${2:-}")"
    shift 2 || true
    # `-f` e o resto passam direto para o journalctl.
    journalctl -u "valmer-$amb" -n 100 "$@"
    ;;

  env)
    amb="$(ambiente "${2:-}")"
    arquivo="/srv/valmer/$amb/env/app.env"
    # Editar o env de producao achando que era homologacao e o erro que este
    # script existe para evitar. Em PRD, para e mostra o alvo antes.
    if [ "$amb" = "prd" ]; then
      echo "Voce vai editar as variaveis de PRODUCAO: $arquivo"
      read -r -p "Enter para continuar, Ctrl+C para sair. " _
    fi
    antes="$(como_deploy md5sum "$arquivo" | cut -d' ' -f1)"
    como_deploy "${EDITOR:-nano}" "$arquivo"
    depois="$(como_deploy md5sum "$arquivo" | cut -d' ' -f1)"
    if [ "$antes" = "$depois" ]; then
      echo "nada mudou, servico nao reiniciado."
    else
      # Variavel so entra no processo no boot: sem reiniciar, a edicao nao vale
      # nada e voce fica achando que aplicou.
      sudo systemctl restart "valmer-$amb"
      echo "aplicado e reiniciado: valmer-$amb"
    fi
    ;;

  db)
    amb="$(ambiente "${2:-}")"
    set -a; . "/srv/valmer/$amb/env/app.env"; set +a
    . "$BIN/lib-pg.sh"; pg_conexao "$DATABASE_URL"
    echo "psql em $PGDATABASE ($amb). \\q para sair."
    psql
    ;;

  restart)
    amb="$(ambiente "${2:-}")"
    sudo systemctl restart "valmer-$amb"
    systemctl is-active "valmer-$amb"
    ;;

  ps)
    docker ps -a --filter name=valmer_ \
      --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
    ;;

  *)
    cat <<'AJUDA'
valmer — controle da plataforma

  valmer status              o que esta de pe, containers, disco, checagem
  valmer logs <amb> [-f]     log da aplicacao
  valmer ps                  containers, com portas
  valmer env <amb>           editar variaveis e reiniciar se mudou
  valmer db <amb>            psql no banco do ambiente
  valmer restart <amb>

Publicar, desfazer e backup ficam nos scripts proprios, para haver um caminho
so e nao dois:

  bash /srv/valmer/bin/deploy.sh <amb> [ref]     publicar
  bash /srv/valmer/bin/deploy.sh rollback <amb>  voltar a versao anterior
  bash /srv/valmer/bin/backup.sh <amb>           dump agora
  bash /srv/valmer/bin/restore.sh hml            testar o restore

Banco (containers): docker compose -f /srv/valmer/<amb>/postgres.compose.yml <ps|logs|restart>
AJUDA
    ;;
esac
