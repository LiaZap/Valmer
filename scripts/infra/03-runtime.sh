#!/usr/bin/env bash
# 03-runtime.sh — o que a aplicacao precisa achar instalado.
#
#   Rodar COMO ROOT, depois do 02.
#   bash 03-runtime.sh
#
# Instala: patch automatico de seguranca, Docker, Node 22 LTS, Nginx, Certbot,
# cliente do Postgres 16 (para o pg_dump rodar no host) e swap.
#
# Idempotente.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "erro: rode como root."; exit 1; }
info() { echo "[03-runtime] $*"; }
export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y ca-certificates curl gnupg git jq unzip \
  postgresql-client-16 unattended-upgrades >/dev/null
info "pacotes base instalados."

# --- patch de seguranca automatico --------------------------------------------
# Pacote de seguranca entra sozinho. Kernel novo so vale depois de reboot, e
# reboot as 4h da manha e melhor que ficar meses com kernel furado.
cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
        "${distro_id}:${distro_codename}-security";
        "${distro_id}ESMApps:${distro_codename}-apps-security";
        "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
EOF
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades >/dev/null
info "unattended-upgrades ligado (reboot automatico as 04:00)."

# --- Docker -------------------------------------------------------------------
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin >/dev/null
fi
systemctl enable --now docker >/dev/null
# O deploy sobe e desce o Postgres. Entrar no grupo docker equivale a root na
# maquina — e uma concessao consciente, registrada em docs/infra.md.
usermod -aG docker "${DEPLOY_USER:-deploy}" 2>/dev/null || true
info "docker $(docker --version | awk '{print $3}' | tr -d ,) pronto."

# --- Node 22 LTS --------------------------------------------------------------
# Next 16 exige Node >= 20.9. O 22 e o LTS com suporte mais longo hoje.
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y nodejs >/dev/null
fi
info "node $(node -v) / npm $(npm -v)."

# --- Nginx + Certbot ----------------------------------------------------------
apt-get install -y nginx certbot python3-certbot-nginx >/dev/null
# A versao do servidor no cabecalho so ajuda quem esta procurando alvo.
sed -i 's/^\s*#\?\s*server_tokens.*/\tserver_tokens off;/' /etc/nginx/nginx.conf
grep -q server_tokens /etc/nginx/nginx.conf || \
  sed -i '/http {/a \\tserver_tokens off;' /etc/nginx/nginx.conf

# Zona de rate limit do login. Precisa existir no contexto http, e nao no vhost.
cat > /etc/nginx/conf.d/valmer-limites.conf <<'EOF'
# Gerado por scripts/infra/03-runtime.sh
# Forca bruta em /api/auth e o ataque mais barato contra esta plataforma.
limit_req_zone $binary_remote_addr zone=valmer_auth:10m rate=10r/m;
limit_req_status 429;
EOF
nginx -t
systemctl enable --now nginx >/dev/null
systemctl reload nginx
info "nginx e certbot prontos."

# --- swap ---------------------------------------------------------------------
# A imagem da Hostinger vem sem swap. `next build` tem pico de memoria; 4 GB de
# folga custam disco e evitam um OOM kill no meio do deploy.
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -qw vm.swappiness=10
  grep -q 'vm.swappiness' /etc/sysctl.conf || echo 'vm.swappiness=10' >> /etc/sysctl.conf
fi
info "swap: $(swapon --show=NAME,SIZE --noheadings | tr '\n' ' ')"

echo
info "Conferir:  docker ps ; node -v ; nginx -t ; free -h ; systemctl status unattended-upgrades"
info "Desfazer:  apt-get remove --purge docker-ce nodejs nginx certbot ; swapoff /swapfile"
