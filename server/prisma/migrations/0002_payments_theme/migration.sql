-- ============================================================
-- 0002_payments_theme
--
-- Adds:
--   PaymentStatus enum
--   Payment         — Stripe checkout session records
--   PaymentWebhookEvent — raw Stripe webhook log
--   ThemeSetting    — admin-configurable UI theme
--
-- Safe to run on a database that already has 0001_init applied.
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED'
);

-- ─── Payment ─────────────────────────────────────────────────────────────────

CREATE TABLE "Payment" (
  "id"                TEXT            NOT NULL,
  "stripeSessionId"   TEXT            NOT NULL,
  "stripePaymentIntent" TEXT,
  "amount"            INTEGER         NOT NULL,   -- cents
  "currency"          TEXT            NOT NULL DEFAULT 'usd',
  "status"            "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "type"              TEXT            NOT NULL DEFAULT 'service', -- service | custom | donation
  "description"       TEXT,
  "customerName"      TEXT,
  "customerEmail"     TEXT,
  "serviceId"         TEXT,
  "serviceName"       TEXT,
  "inquiryId"         TEXT,
  "metadata"          JSONB,
  "receiptUrl"        TEXT,
  "createdAt"         TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Payment_stripeSessionId_key" ON "Payment"("stripeSessionId");
CREATE INDEX "Payment_status_idx"    ON "Payment"("status");
CREATE INDEX "Payment_type_idx"      ON "Payment"("type");
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
CREATE INDEX "Payment_customerEmail_idx" ON "Payment"("customerEmail");

-- ─── PaymentWebhookEvent ────────────────────────────────────────────────────

CREATE TABLE "PaymentWebhookEvent" (
  "id"          TEXT         NOT NULL,
  "stripeEventId" TEXT       NOT NULL,
  "type"        TEXT         NOT NULL,
  "payload"     JSONB        NOT NULL,
  "processed"   BOOLEAN      NOT NULL DEFAULT false,
  "error"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentWebhookEvent_stripeEventId_key" ON "PaymentWebhookEvent"("stripeEventId");
CREATE INDEX "PaymentWebhookEvent_type_idx"      ON "PaymentWebhookEvent"("type");
CREATE INDEX "PaymentWebhookEvent_processed_idx" ON "PaymentWebhookEvent"("processed");

-- ─── ThemeSetting ──────────────────────────────────────────────────────────

CREATE TABLE "ThemeSetting" (
  "id"            TEXT         NOT NULL DEFAULT 'default',
  "mode"          TEXT         NOT NULL DEFAULT 'dark',
  "primaryColor"  TEXT         NOT NULL DEFAULT '#6366f1',
  "accentColor"   TEXT         NOT NULL DEFAULT '#8b5cf6',
  "fontSans"      TEXT         NOT NULL DEFAULT 'Plus Jakarta Sans',
  "fontMono"      TEXT         NOT NULL DEFAULT 'JetBrains Mono',
  "fontDisplay"   TEXT         NOT NULL DEFAULT 'Syne',
  "borderRadius"  TEXT         NOT NULL DEFAULT 'rounded',  -- sharp | rounded | pill
  "animationSpeed" TEXT        NOT NULL DEFAULT 'normal',   -- slow | normal | fast | none
  "customCss"     TEXT,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ThemeSetting_pkey" PRIMARY KEY ("id")
);

-- Seed the single default theme row
INSERT INTO "ThemeSetting" ("id", "mode", "primaryColor", "accentColor", "fontSans", "fontMono", "fontDisplay", "borderRadius", "animationSpeed", "updatedAt")
VALUES ('default', 'dark', '#6366f1', '#8b5cf6', 'Plus Jakarta Sans', 'JetBrains Mono', 'Syne', 'rounded', 'normal', NOW());
