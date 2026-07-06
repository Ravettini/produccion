import { PrismaClient } from "@prisma/client";
import { createMockPrisma, type MockPrismaClient } from "./mockPrisma.js";

function shouldUseMock(): boolean {
  const flag = process.env.NO_DATABASE;
  return flag === "true" || flag === "1";
}

function requireDatabaseUrl(): void {
  if (shouldUseMock()) return;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "[api] DATABASE_URL es obligatoria. Configurala en apps/api/.env o en el entorno de deploy."
    );
  }
  if (!url.startsWith("postgres")) {
    throw new Error(
      "[api] DATABASE_URL debe ser una URL PostgreSQL (postgresql://...)."
    );
  }
}

requireDatabaseUrl();

export const isMockMode = shouldUseMock();

export const prisma: MockPrismaClient | PrismaClient = isMockMode
  ? createMockPrisma()
  : new PrismaClient();

if (isMockMode) {
  console.warn(
    "[api] NO_DATABASE=true — datos en memoria (solo desarrollo). Credenciales: admin@gobierno.gob / admin123"
  );
}
