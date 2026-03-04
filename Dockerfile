FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY apps/brief-generator ./apps/brief-generator
COPY apps/api ./apps/api

WORKDIR /app/apps/brief-generator
RUN npm ci && npm run build

WORKDIR /app/apps/api
RUN npm ci && npx prisma generate && npm run build && npm prune --omit=dev

WORKDIR /app/apps/api
RUN mkdir -p uploads/events
EXPOSE 4000
CMD ["node", "dist/index.js"]
