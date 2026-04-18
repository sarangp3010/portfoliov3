-- ============================================================
-- 0003_payment_source
--
-- Adds two columns to Payment:
--   paymentSource  TEXT  — 'direct' (pay now from services page)
--                          'inquiry' (deposit after inquiry submit)
--   planId         TEXT  — id of the ServicePlan selected (direct flow only)
--
-- Safe to run on a database with 0001_init + 0002_payments_theme applied.
-- ============================================================

ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "paymentSource" TEXT NOT NULL DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS "planId"        TEXT;

CREATE INDEX IF NOT EXISTS "Payment_paymentSource_idx" ON "Payment"("paymentSource");
