#!/usr/bin/env bash
# install.sh — one-command setup for the SAS Gemini Dashboard
# Run from the cloned repo: bash install.sh
# Or if the repo is public: curl -fsSL https://raw.githubusercontent.com/sas-technology/gemini-users/main/install.sh | bash
set -euo pipefail

IMAGE="ghcr.io/sas-technology/gemini-users:latest"

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}SAS Gemini Dashboard — Setup${RESET}"
echo "──────────────────────────────────────"
echo ""

# ── Prerequisites ──────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo -e "${RED}Error: Docker is not installed.${RESET}"
  echo "Install it from https://docs.docker.com/get-docker/ and re-run."
  exit 1
fi

if ! docker compose version &>/dev/null 2>&1; then
  echo -e "${RED}Error: Docker Compose plugin not found.${RESET}"
  echo "Upgrade Docker Desktop or install the compose plugin and re-run."
  exit 1
fi

echo -e "${GREEN}✓ Docker $(docker --version | awk '{print $3}' | tr -d ',')${RESET}"
echo ""

# ── Choose install directory ───────────────────────────────────────────────────
read -rp "Install directory [./sas-gemini]: " INSTALL_DIR
INSTALL_DIR="${INSTALL_DIR:-./sas-gemini}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo ""
echo -e "${BOLD}Configuration${RESET}"
echo "You'll need the Apps Script Web App URL and API key from Part 1 of the setup."
echo "See https://github.com/sas-technology/gemini-users#part-1--apps-script-setup"
echo ""

# ── Collect credentials ────────────────────────────────────────────────────────
while true; do
  read -rsp "Dashboard password (users will log in with this): " DASHBOARD_SECRET
  echo ""
  if [[ -n "$DASHBOARD_SECRET" ]]; then break; fi
  echo -e "${YELLOW}Password cannot be empty.${RESET}"
done

while true; do
  read -rp "Apps Script Web App URL: " APPS_SCRIPT_URL
  if [[ "$APPS_SCRIPT_URL" == https://script.google.com/* ]]; then break; fi
  echo -e "${YELLOW}URL must start with https://script.google.com/...${RESET}"
done

while true; do
  read -rsp "Apps Script API key: " APPS_SCRIPT_API_KEY
  echo ""
  if [[ -n "$APPS_SCRIPT_API_KEY" ]]; then break; fi
  echo -e "${YELLOW}API key cannot be empty.${RESET}"
done

read -rp "Public URL of this server [http://localhost:3000]: " ORIGIN
ORIGIN="${ORIGIN:-http://localhost:3000}"

# ── Write .env ─────────────────────────────────────────────────────────────────
cat > .env <<EOF
DASHBOARD_SECRET=${DASHBOARD_SECRET}
APPS_SCRIPT_URL=${APPS_SCRIPT_URL}
APPS_SCRIPT_API_KEY=${APPS_SCRIPT_API_KEY}
ORIGIN=${ORIGIN}
EOF
chmod 600 .env
echo -e "${GREEN}✓ .env written${RESET}"

# ── Write docker-compose.yml ───────────────────────────────────────────────────
cat > docker-compose.yml <<'COMPOSE'
services:
  sas-gemini:
    image: ghcr.io/sas-technology/gemini-users:latest
    ports:
      - '3000:3000'
    environment:
      - DASHBOARD_SECRET=${DASHBOARD_SECRET}
      - APPS_SCRIPT_URL=${APPS_SCRIPT_URL}
      - APPS_SCRIPT_API_KEY=${APPS_SCRIPT_API_KEY}
      - ORIGIN=${ORIGIN}
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'wget', '-qO-', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
COMPOSE
echo -e "${GREEN}✓ docker-compose.yml written${RESET}"

# ── Pull image and start ───────────────────────────────────────────────────────
echo ""
echo "Pulling image ${IMAGE} …"
docker compose pull

echo ""
echo "Starting container …"
docker compose up -d

# ── Health check ───────────────────────────────────────────────────────────────
echo ""
echo -n "Waiting for dashboard to be ready"
for i in $(seq 1 30); do
  if curl -sf "${ORIGIN}/api/health" &>/dev/null; then
    echo ""
    echo -e "${GREEN}✓ Dashboard is up${RESET}"
    break
  fi
  echo -n "."
  sleep 2
done

echo ""
echo -e "${BOLD}Done.${RESET}"
echo ""
echo -e "  Dashboard → ${GREEN}${ORIGIN}${RESET}"
echo "  Log in with the password you just set."
echo ""
echo "Useful commands (run from $INSTALL_DIR):"
echo "  docker compose logs -f"
echo "  docker compose pull && docker compose up -d   # update to latest"
echo "  docker compose down"
