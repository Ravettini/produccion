#!/bin/sh
set -e
cd /app/apps/api

if [ "${SKIP_DB_MIGRATE:-0}" != "1" ] && [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    postgres:*|postgresql:*)
      echo "[entrypoint] Aplicando migraciones Prisma (PostgreSQL)..."
      npx prisma migrate deploy
      ;;
    *)
      echo "[entrypoint] DATABASE_URL no es PostgreSQL; se omiten migraciones."
      ;;
  esac
fi

exec node dist/index.js
