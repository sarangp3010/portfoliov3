-- ─── 0004_customer_portal ────────────────────────────────────────────────────
-- Adds Customer, CustomerSession, CustomerMessage, and SavedPaymentMethod
-- Safe to run on a database that already has migrations 0001-0003 applied

-- Enum for OAuth providers
DO $$ BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('local', 'google', 'github', 'microsoft');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum for customer message status
DO $$ BEGIN
  CREATE TYPE "MessageStatus" AS ENUM ('UNREAD', 'READ', 'REPLIED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Customer ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Customer" (
  "id"                TEXT        NOT NULL,
  "email"             TEXT        NOT NULL,
  "password"          TEXT,
  "name"              TEXT        NOT NULL,
  "phone"             TEXT,
  "avatarUrl"         TEXT,
  "provider"          "AuthProvider" NOT NULL DEFAULT 'local',
  "providerId"        TEXT,
  "stripeCustomerId"  TEXT,
  "isActive"          BOOLEAN     NOT NULL DEFAULT true,
  "emailVerified"     BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_provider_idx" ON "Customer"("provider");
CREATE INDEX IF NOT EXISTS "Customer_stripeCustomerId_idx" ON "Customer"("stripeCustomerId");

-- ─── CustomerSession ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CustomerSession" (
  "id"           TEXT        NOT NULL,
  "customerId"   TEXT        NOT NULL,
  "token"        TEXT        NOT NULL,
  "ipAddress"    TEXT,
  "userAgent"    TEXT,
  "browser"      TEXT,
  "device"       TEXT,
  "loginAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "isActive"     BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerSession_token_key" ON "CustomerSession"("token");
CREATE INDEX IF NOT EXISTS "CustomerSession_customerId_idx" ON "CustomerSession"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerSession_token_idx" ON "CustomerSession"("token");
CREATE INDEX IF NOT EXISTS "CustomerSession_isActive_idx" ON "CustomerSession"("isActive");
CREATE INDEX IF NOT EXISTS "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");

ALTER TABLE "CustomerSession"
  ADD CONSTRAINT "CustomerSession_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE;

-- ─── CustomerMessage ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "CustomerMessage" (
  "id"          TEXT          NOT NULL,
  "customerId"  TEXT          NOT NULL,
  "message"     TEXT          NOT NULL,
  "status"      "MessageStatus" NOT NULL DEFAULT 'UNREAD',
  "adminReply"  TEXT,
  "createdAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CustomerMessage_customerId_idx" ON "CustomerMessage"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerMessage_status_idx" ON "CustomerMessage"("status");
CREATE INDEX IF NOT EXISTS "CustomerMessage_createdAt_idx" ON "CustomerMessage"("createdAt");

ALTER TABLE "CustomerMessage"
  ADD CONSTRAINT "CustomerMessage_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE;

-- ─── Link Payments to Customers ───────────────────────────────────────────────
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "customerId" TEXT;

CREATE INDEX IF NOT EXISTS "Payment_customerId_idx" ON "Payment"("customerId");
