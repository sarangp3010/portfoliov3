-- ─── 0006_notifications ───────────────────────────────────────────────────────
-- Adds Notification table for in-app notification system.
-- Safe to run on a database with migrations 0001-0005 applied.

CREATE TABLE IF NOT EXISTS "Notification" (
  "id"            TEXT         NOT NULL,
  "recipientType" TEXT         NOT NULL,
  "recipientId"   TEXT         NOT NULL,
  "type"          TEXT         NOT NULL DEFAULT 'info',
  "event"         TEXT         NOT NULL,
  "message"       TEXT         NOT NULL,
  "link"          TEXT,
  "isRead"        BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notification_recipient_read_idx"
  ON "Notification"("recipientType", "recipientId", "isRead");

CREATE INDEX IF NOT EXISTS "Notification_recipient_date_idx"
  ON "Notification"("recipientType", "recipientId", "createdAt");
