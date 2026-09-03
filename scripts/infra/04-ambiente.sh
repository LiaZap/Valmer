#!/usr/bin/env bash
# 04-ambiente.sh — cria UM ambiente (hml ou prd) na maquina.
#
#   Rodar COMO ROOT, depois do 03. Uma vez para cada ambiente:
#     DOMINIO=hml.perfila.com.br bash 04-ambiente.sh hml
#     DOMINIO=app.perfila.com.br bash 04-ambiente.sh prd
#
# Cria: diretorios, arquivos de segredo (0600, gerados uma unica vez), Postgres
# proprio em container ouvindo so no localhost, servico systemd com teto de
# memoria e vhost do Nginx.
#
# HML e PRD nao compartilham banco, usuario do banco, porta, segredo nem
# processo. O que eles compartilham e o kernel e o disco — e disso trata o
# ADR-0005.
#
# Idempotente: NAO sobrescreve arquivo de segredo que ja existe.
set -euo pipefail

AMB="${1:-}"
case "$AMB" in
  hml) PORTA_APP=3001; PORTA_PG=5433; MEM_APP=4G; MEM_PG=2g; PESO_CPU=50 ;;
  prd) PORTA_APP=3000; PORTA_PG=5432; MEM_APP=8G; MEM_PG=6g; PESO_CPU=200 ;;
  *)   echo "uso: DOMINIO=<dominio> bash 04-ambiente.sh <hml|prd>"; exit 1 ;;
esac

[ "$(id -u)" -eq 0 ] || { echo "erro: rode como root."; exit 1; }
DOMINIO="${DOMINIO:?defina DOMINIO=... (ex.: hml.perfila.com.br)}"
REPO="${REPO:-https://github.com/LiaZap/Valmer.git}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
BASE="/srv/valmer/$AMB"
info() { echo "[04-$AMB] $*"; }

# --- diretorios ---------------------------------------------------------------
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 750 \
  /srv/valmer "$BASE" "$BASE/releases" "$BASE/backups"
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" -m 700 "$BASE/env"

# --- segredos -----------------------------------------------------------------
# Gerados na maquina, uma vez. Nunca passam pelo git, nunca pelo GitHub, nunca
# por ARG de Dockerfile. Se o arquivo ja existe, este script nao encosta nele.
PG_ENV="$BASE/env/postgres.env"
APP_ENV="$BASE/env/app.env"

if [ ! -f "$PG_ENV" ]; then
  SENHA_PG="$(openssl rand -hex 24)"
  cat > "$PG_ENV" <<EOF
POSTGRES_DB=valmer_$AMB
POSTGRES_USER=valmer_$AMB
POSTGRES_PASSWORD=$SENHA_PG
EOF
  info "segredo do Postgres gerado."
else
  SENHA_PG="$(grep '^POSTGRES_PASSWORD=' "$PG_ENV" | cut -d= -f2-)"
  info "segredo do Postgres ja existia — mantido."
fi

if [ ! -f "$APP_ENV" ]; then
  cat > "$APP_ENV" <<EOF
NODE_ENV=production
DATABASE_URL=postgres://valmer_$AMB:$SENHA_PG@127.0.0.1:$PORTA_PG/valmer_$AMB
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=https://$DOMINIO
# PENDENTE: cole a chave da Anthropic aqui e rode `systemctl restart valmer-$AMB`.
ANTHROPIC_API_KEY=
EOF
  info "app.env gerado. FALTA preencher ANTHROPIC_API_KEY."
else
  info "app.env ja existia — mantido."
fi
chmod 600 "$PG_ENV" "$APP_ENV"
chown "$DEPLOY_USER:$DEPLOY_USER" "$PG_ENV" "$APP_ENV"

# --- Postgres do ambiente -----------------------------------------------------
# "127.0.0.1:" no publish nao e detalhe de estilo: sem isso o Docker publica em
# 0.0.0.0, fura o UFW e o banco vai para a internet.
cat > "$BASE/postgres.compose.yml" <<EOF
name: valmer-$AMB
services:
  db:
    image: postgres:16
    container_name: valmer_${AMB}_db
    restart: unless-stopped
    env_file: ./env/postgres.env
    ports:
      - "127.0.0.1:$PORTA_PG:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    mem_limit: $MEM_PG
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U valmer_$AMB -d valmer_$AMB"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "5" }
volumes:
  pgdata:
    name: valmer_${AMB}_pgdata
EOF
chown "$DEPLOY_USER:$DEPLOY_USER" "$BASE/postgres.compose.yml"
docker compose -f "$BASE/postgres.compose.yml" up -d
info "postgres do $AMB em 127.0.0.1:$PORTA_PG."

# --- servico da aplicacao -----------------------------------------------------
# MemoryMax e CPUWeight sao o que impede o HML de derrubar o PRD numa maquina
# so. Sem eles, um build ou um teste de carga em homologacao vira incidente em
# producao.
cat > "/etc/systemd/system/valmer-$AMB.service" <<EOF
# Gerado por scripts/infra/04-ambiente.sh — nao editar a mao.
[Unit]
Description=Valmer (Perfila) — $AMB
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$BASE/current/perfila
EnvironmentFile=$BASE/env/app.env
Environment=NODE_ENV=production
Environment=PORT=$PORTA_APP
ExecStart=/usr/bin/npm run start -- --port $PORTA_APP --hostname 127.0.0.1
Restart=always
RestartSec=5
MemoryMax=$MEM_APP
CPUWeight=$PESO_CPU
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$BASE
StandardOutput=journal
StandardError=journal
SyslogIdentifier=valmer-$AMB

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "valmer-$AMB" >/dev/null
info "servico valmer-$AMB registrado (sem subir: falta o primeiro deploy)."

# --- vhost --------------------------------------------------------------------
# So HTTP aqui. O certbot escreve o bloco 443 e o redirecionamento na etapa 5.
cat > "/etc/nginx/sites-available/valmer-$AMB" <<EOF
# Gerado por scripts/infra/04-ambiente.sh — o certbot adiciona o bloco 443.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMINIO;

    client_max_body_size 5m;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Login e o alvo barato. 10 req/min por IP, com folga de 5 para o burst.
    location /api/auth {
        limit_req zone=valmer_auth burst=5 nodelay;
        proxy_pass http://127.0.0.1:$PORTA_APP;
        include /etc/nginx/proxy_params;
    }

    location / {
        proxy_pass http://127.0.0.1:$PORTA_APP;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        include /etc/nginx/proxy_params;
    }
}
EOF
ln -sfn "/etc/nginx/sites-available/valmer-$AMB" "/etc/nginx/sites-enabled/valmer-$AMB"
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
info "vhost de $DOMINIO no ar (HTTP)."

echo
info "Conferir:"
info "  docker compose -f $BASE/postgres.compose.yml ps"
info "  ss -ltnp | grep $PORTA_PG        # tem que ser 127.0.0.1"
info "  curl -I http://$DOMINIO          # 502 aqui e esperado ate o 1o deploy"
info "Desfazer:"
info "  systemctl disable --now valmer-$AMB; rm /etc/systemd/system/valmer-$AMB.service"
info "  rm /etc/nginx/sites-enabled/valmer-$AMB; systemctl reload nginx"
info "  docker compose -f $BASE/postgres.compose.yml down     # -v APAGA O BANCO"
