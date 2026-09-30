#!/usr/bin/env bash
# Запуск полного стека B2B Match через OrbStack (Docker Compose).
# Запускай в обычном Terminal.app / iTerm — не из песочницы Cursor.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ORB_APP="/Applications/Code/OrbStack.app"
if [[ ! -d "$ORB_APP" ]]; then
  ORB_APP="/Applications/OrbStack.app"
fi

echo "==> OrbStack status: $(orbctl status 2>&1 || true)"
if ! orbctl status 2>/dev/null | grep -qi running; then
  echo "==> Starting OrbStack app: $ORB_APP"
  open "$ORB_APP" || open -a OrbStack || true
  echo "    Waiting for Docker engine..."
  for i in $(seq 1 60); do
    if docker info >/dev/null 2>&1; then
      echo "    Docker is ready."
      break
    fi
    sleep 2
    if [[ "$i" -eq 60 ]]; then
      echo "ERROR: OrbStack/Docker не поднялся. Открой OrbStack вручную из меню и повтори."
      exit 1
    fi
  done
fi

if [[ ! -f .env ]]; then
  echo "==> Creating .env from backend_max/.env.example"
  cp backend_max/.env.example .env
  echo "    Заполни BOT_TOKEN в .env при необходимости."
fi

echo "==> docker compose up -d --build"
docker compose up -d --build
docker compose ps

echo
echo "Готово:"
echo "  UI (Caddy):     https://localhost"
echo "  Backend:        http://localhost:8000"
echo "  Swagger:        http://localhost:8000/docs"
echo "  Health:         http://localhost:8000/health"
echo
echo "Остановка:  docker compose down"
