#!/usr/bin/env bash
# Запуск Strapi под Node 20+, если nvm не подключён в zsh/bash по умолчанию.
set -euo pipefail
cd "$(dirname "$0")/.."

# npm передаёт это в дочерние процессы; nvm с ним несовместим (см. nvm README).
unset npm_config_prefix

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env)"
  if [ -f .nvmrc ]; then
    fnm use >/dev/null 2>&1 || fnm install
  else
    fnm use 20 >/dev/null 2>&1 || true
  fi
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
elif [ -s "$HOME/.config/nvm/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.config/nvm/nvm.sh"
fi

if command -v nvm >/dev/null 2>&1; then
  if [ -f .nvmrc ]; then
    nvm install >/dev/null 2>&1 || true
    nvm use
  else
    nvm use 20 >/dev/null 2>&1 || nvm use default
  fi
fi

major="$(node -p "parseInt(process.version.slice(1).split('.')[0],10)" 2>/dev/null || echo 0)"
if [ "${major:-0}" -lt 20 ]; then
  echo ""
  echo "Strapi 5 требует Node.js 20+. Сейчас: $(node -v 2>/dev/null || echo 'node не найден')"
  echo "Варианты: установите Node 20+, или nvm (https://github.com/nvm-sh/nvm), или fnm."
  echo "С nvm в этом терминале: export NVM_DIR=\"\$HOME/.nvm\" && . \"\$NVM_DIR/nvm.sh\" && nvm use"
  echo ""
  exit 1
fi

exec ./node_modules/.bin/strapi develop "$@"
