#!/usr/bin/env bash
# Установка sing-box (VLESS client) на Ubuntu/Debian стенд.
# Запуск из корня репо: bash deploy/sing-box/install.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CFG_SRC="$ROOT/deploy/sing-box/config.json"

if [[ ! -f "$CFG_SRC" ]]; then
  echo "Нет $CFG_SRC"
  exit 1
fi

if ! command -v sing-box >/dev/null 2>&1; then
  echo "Installing sing-box..."
  curl -fsSL https://sing-box.app/install.sh | sh
fi

mkdir -p /etc/sing-box
cp "$CFG_SRC" /etc/sing-box/config.json
chmod 600 /etc/sing-box/config.json

sing-box check -c /etc/sing-box/config.json

systemctl enable --now sing-box
systemctl restart sing-box
systemctl --no-pager -l status sing-box || true

echo
echo "HTTP proxy listening on 0.0.0.0:7890"
echo "Закрой порт снаружи: ufw deny 7890/tcp   (или iptables)"
echo "Проверка: curl -x http://127.0.0.1:7890 -sI https://openrouter.ai | head"
