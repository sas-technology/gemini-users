#!/usr/bin/env bash
# install.sh — one-command setup for the SAS Gemini Dashboard
# Run from the cloned repo: bash install.sh
set -euo pipefail

IMAGE="ghcr.io/sas-technology/gemini-users:latest"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
INSTALL_DIR="$(mkdir -p "$INSTALL_DIR" && cd "$INSTALL_DIR" && pwd)"
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

# ── macOS: LaunchAgent for auto-start on login ─────────────────────────────────
if [[ "$(uname)" == "Darwin" ]]; then
  echo ""
  read -rp "Install macOS LaunchAgent (auto-start on login)? [Y/n]: " INSTALL_AGENT
  INSTALL_AGENT="${INSTALL_AGENT:-Y}"
  if [[ "$INSTALL_AGENT" =~ ^[Yy]$ ]]; then
    PLIST_SRC="${SCRIPT_DIR}/macos/com.sas.gemini-dashboard.plist"
    PLIST_DEST="${HOME}/Library/LaunchAgents/com.sas.gemini-dashboard.plist"
    DOCKER_BIN="$(command -v docker)"

    if [[ -f "$PLIST_SRC" ]]; then
      sed "s|INSTALL_DIR_PLACEHOLDER|${INSTALL_DIR}|g; s|/usr/local/bin/docker|${DOCKER_BIN}|g" \
        "$PLIST_SRC" > "$PLIST_DEST"
    else
      # Inline fallback if plist template not found
      cat > "$PLIST_DEST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.sas.gemini-dashboard</string>
  <key>ProgramArguments</key>
  <array>
    <string>${DOCKER_BIN}</string>
    <string>compose</string>
    <string>--project-directory</string>
    <string>${INSTALL_DIR}</string>
    <string>up</string>
    <string>-d</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
  <key>StandardOutPath</key>
  <string>/tmp/sas-gemini-dashboard.log</string>
  <key>StandardErrorPath</key>
  <string>/tmp/sas-gemini-dashboard.log</string>
</dict>
</plist>
PLIST
    fi

    launchctl load "$PLIST_DEST" 2>/dev/null || true
    echo -e "${GREEN}✓ LaunchAgent installed — container will start automatically on login${RESET}"
  fi
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Done.${RESET}"
echo ""
echo -e "  Dashboard → ${GREEN}${ORIGIN}${RESET}"
echo "  Log in with the password you just set."
echo ""

if [[ "$(uname)" == "Darwin" ]]; then
  echo -e "${BOLD}Add to Dock (macOS):${RESET}"
  echo "  Safari:  File → Add to Dock"
  echo "  Chrome:  ⋮ → Save and Share → Add to Dock"
  echo ""
fi

echo "Useful commands (run from ${INSTALL_DIR}):"
echo "  docker compose logs -f"
echo "  docker compose pull && docker compose up -d   # update to latest"
echo "  docker compose down"
