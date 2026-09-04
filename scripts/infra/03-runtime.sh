#!/usr/bin/env bash
# 03-runtime.sh — o que a aplicacao precisa achar instalado.
#
#   Rodar COMO ROOT, depois do 02.
#   bash 03-runtime.sh
#
# Instala so o que vale nos dois caminhos possiveis (painel ou manual): patch
# automatico de seguranca, Docker, cliente do Postgres 16 (para o pg_dump rodar
# no host) e swap.
#
# Node, Nginx e Certbot NAO entram aqui. No caminho com EasyPanel quem faz proxy
# e TLS e o Traefik do painel, e um Nginx ocupando 80/443 impede o painel de
# subir. Eles sao instalados pelo 04-ambiente.sh, que e o caminho manual.
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
info "Conferir:  docker ps ; free -h ; systemctl status unattended-upgrades"
info "Desfazer:  apt-get remove --purge docker-ce ; swapoff /swapfile"
