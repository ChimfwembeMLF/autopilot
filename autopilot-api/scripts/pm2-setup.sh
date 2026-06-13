#!/usr/bin/env bash
# One-time PM2 setup on a Linux server (run from autopilot-api/).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Create .env in $(pwd) before starting (DB_*, JWT_*, SESSION_SECRET, etc.)"
  exit 1
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing PM2 globally..."
  npm install -g pm2
fi

mkdir -p logs
npm run build
npm run pm2:start
pm2 save

echo ""
echo "API running under PM2 as 'autopilot-api'."
echo "  pm2 status"
echo "  pm2 logs autopilot-api"
echo ""
echo "Enable restart on server reboot:"
echo "  pm2 startup"
echo "  (run the command it prints, then: pm2 save)"
