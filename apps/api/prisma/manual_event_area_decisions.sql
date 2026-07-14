-- Tablas para checks por área y auditoría de ediciones de eventos.
-- Ejecutar si `prisma db push` no alcanza vpn.helio3.co:5433

CREATE TABLE IF NOT EXISTS "EventAreaDecision" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "areaRole" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'PENDING',
  "userId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventAreaDecision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EventAreaDecision_eventId_areaRole_key"
  ON "EventAreaDecision"("eventId", "areaRole");
CREATE INDEX IF NOT EXISTS "EventAreaDecision_eventId_idx"
  ON "EventAreaDecision"("eventId");

CREATE TABLE IF NOT EXISTS "EventAudit" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "field" TEXT,
  "fromValue" TEXT,
  "toValue" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EventAudit_eventId_idx" ON "EventAudit"("eventId");

DO $$ BEGIN
  ALTER TABLE "EventAreaDecision"
    ADD CONSTRAINT "EventAreaDecision_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EventAreaDecision"
    ADD CONSTRAINT "EventAreaDecision_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EventAudit"
    ADD CONSTRAINT "EventAudit_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "EventAudit"
    ADD CONSTRAINT "EventAudit_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
