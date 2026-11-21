#!/usr/bin/env bash
# Деплой полного сайта DS DIGITAL на VPS (внешняя БД Supabase).
# Использование на сервере:
#   git clone https://github.com/SDDigital26/DS-DIGITAL.git /opt/ds-digital
#   cd /opt/ds-digital
#   cp .env.example .env   # затем заполнить СЕКРЕТЫ вручную!
#   bash scripts/deploy-vps.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Нет .env. Скопируйте .env.example в .env и заполните DATABASE_URL_DOCKER / NEXT_PUBLIC_SITE_URL." >&2
  exit 1
fi

if ! grep -q 'NEXT_PUBLIC_SITE_URL=' .env; then
  echo "В .env нет NEXT_PUBLIC_SITE_URL." >&2
  exit 1
fi

echo "[deploy] docker compose pull/build..."
docker compose -f docker-compose.prod.yml up -d --build

echo "[deploy] ожидание health..."
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "[deploy] готово:"
    curl -fsS http://127.0.0.1:3000/api/health
    exit 0
  fi
  sleep 2
done

echo "[deploy] health не прошёл — смотрите логи:" >&2
docker compose -f docker-compose.prod.yml logs --tail=50 web >&2
exit 1
