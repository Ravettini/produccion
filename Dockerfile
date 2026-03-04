# Stage 1: build brief-generator
FROM node:20-alpine AS builder-brief
WORKDIR /app/apps/brief-generator
COPY apps/brief-generator/package*.json ./
RUN npm ci
COPY apps/brief-generator/ ./
RUN npm run build

# Stage 2: build api
FROM node:20-alpine AS builder-api
WORKDIR /app/apps/api
COPY apps/api/package*.json ./
COPY --from=builder-brief /app/apps/brief-generator /app/apps/brief-generator
COPY apps/api/ ./
RUN npm ci && npx prisma generate && npm run build && npm prune --omit=dev

# Stage 3: runtime mínimo
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN mkdir -p uploads/events
COPY --from=builder-api /app/apps/api/dist ./dist
COPY --from=builder-api /app/apps/api/node_modules ./node_modules
COPY --from=builder-api /app/apps/api/prisma ./prisma
COPY --from=builder-api /app/apps/api/package.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
