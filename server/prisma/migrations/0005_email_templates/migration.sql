-- ─── 0005_email_templates ─────────────────────────────────────────────────────
-- Adds EmailTemplate table for database-driven email management
-- Safe to run on a database that already has migrations 0001-0004 applied

CREATE TABLE IF NOT EXISTS "EmailTemplate" (
  "id"        TEXT         NOT NULL,
  "key"       TEXT         NOT NULL,
  "name"      TEXT         NOT NULL,
  "subject"   TEXT         NOT NULL,
  "html"      TEXT         NOT NULL,
  "text"      TEXT,
  "variables" TEXT[]       NOT NULL DEFAULT '{}',
  "isSystem"  BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailTemplate_key_key" ON "EmailTemplate"("key");
CREATE        INDEX IF NOT EXISTS "EmailTemplate_key_idx" ON "EmailTemplate"("key");
