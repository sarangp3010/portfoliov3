-- ─── 0007_page_sections ───────────────────────────────────────────────────────
-- Adds PageSection table for dynamic UI configuration.
-- Safe to run on a database with migrations 0001-0006 applied.

CREATE TABLE IF NOT EXISTS "PageSection" (
  "id"          TEXT         NOT NULL,
  "page"        TEXT         NOT NULL,
  "key"         TEXT         NOT NULL,
  "sectionType" TEXT         NOT NULL DEFAULT 'custom',
  "title"       TEXT,
  "subtitle"    TEXT,
  "body"        TEXT,
  "ctaText"     TEXT,
  "ctaLink"     TEXT,
  "icon"        TEXT,
  "imageUrl"    TEXT,
  "content"     JSONB        NOT NULL DEFAULT '{}',
  "style"       JSONB        NOT NULL DEFAULT '{}',
  "animation"   JSONB        NOT NULL DEFAULT '{}',
  "variant"     TEXT         NOT NULL DEFAULT 'default',
  "mobileHide"  BOOLEAN      NOT NULL DEFAULT false,
  "desktopHide" BOOLEAN      NOT NULL DEFAULT false,
  "isVisible"   BOOLEAN      NOT NULL DEFAULT true,
  "order"       INTEGER      NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PageSection_page_key_key" ON "PageSection"("page", "key");
CREATE        INDEX IF NOT EXISTS "PageSection_page_visible_idx" ON "PageSection"("page", "isVisible", "order");
