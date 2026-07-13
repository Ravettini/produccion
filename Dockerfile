FROM node:20-slim

WORKDIR /app

# Prisma necesita OpenSSL en runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Instala dependencias del monorepo
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/
COPY apps/brief-generator/package*.json ./apps/brief-generator/
RUN npm ci

# Copia código fuente
COPY . .

# Cliente Prisma (el schema se aplica en runtime con DB disponible)
RUN npm run db:generate

# Misma URL que el navegador: API y SPA en el mismo origen/puerto
ENV VITE_API_BASE=""
ENV WEB_DIST_PATH=/app/apps/web/dist
ENV NODE_ENV=production

# Build brief-generator + frontend + API
ARG APP_BUILD_ID=dev
ENV APP_BUILD_ID=$APP_BUILD_ID
RUN npm run build \
  && test -f apps/web/dist/index.html \
  && test -f apps/api/dist/index.js

RUN mkdir -p apps/api/uploads/events

COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh 2>/dev/null || sed -i '' 's/\r$//' /entrypoint.sh

ENV WEB_DIST_PATH=/app/apps/web/dist

EXPOSE 4000

WORKDIR /app/apps/api
ENTRYPOINT ["/entrypoint.sh"]
