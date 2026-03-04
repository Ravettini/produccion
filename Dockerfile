FROM node:20-alpine
WORKDIR /app
COPY apps/brief-generator ./apps/brief-generator
COPY apps/api ./apps/api

# Build con devDependencies (TypeScript, etc.); Coolify puede inyectar NODE_ENV=production
WORKDIR /app/apps/brief-generator
RUN NODE_ENV=development npm ci && npx tsc

WORKDIR /app/apps/api
RUN NODE_ENV=development npm ci && npx prisma generate && npx tsc && npm prune --omit=dev

WORKDIR /app/apps/api
RUN mkdir -p uploads/events
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
