#!/bin/sh
set -e
cd /app/apps/api

export WEB_DIST_PATH="${WEB_DIST_PATH:-/app/apps/web/dist}"
export NODE_ENV="${NODE_ENV:-production}"

if [ -f "$WEB_DIST_PATH/index.html" ]; then
  echo "[entrypoint] Frontend OK: $WEB_DIST_PATH/index.html"
else
  echo "[entrypoint] AVISO: no se encontró $WEB_DIST_PATH/index.html — GET / devolverá error"
fi

if [ "${SKIP_DB_MIGRATE:-0}" != "1" ] && [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    postgres:*|postgresql:*)
      echo "[entrypoint] Aplicando migraciones Prisma (PostgreSQL)..."
      npx prisma migrate deploy
      if [ "${SKIP_DB_SEED:-0}" != "1" ]; then
        echo "[entrypoint] Cargando usuarios iniciales (seed)..."
        npm run db:seed
      fi
      ;;
    *)
      echo "[entrypoint] DATABASE_URL no es PostgreSQL; se omiten migraciones."
      ;;
  esac
fi

exec node dist/index.js
