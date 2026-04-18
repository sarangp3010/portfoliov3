# Database Migrations

This document explains how the database migration system works, what commands to use in different situations, and the rules that keep migrations safe across all environments.

---

## Overview

This project uses **Prisma Migrate** for all database schema management. Migrations are plain SQL files stored in version control. Every environment — local development, staging, and production — runs exactly the same set of migration files in exactly the same order.

```
server/prisma/
├── schema.prisma              ← Source of truth for the schema
├── seed.ts                    ← Default data (admin user, demo content)
└── migrations/
    ├── migration_lock.toml    ← Locks the database provider (do not edit)
    └── 0001_init/
        └── migration.sql      ← Creates the entire database from scratch
```

When you add a future migration it sits alongside `0001_init` as a new numbered directory:

```
└── migrations/
    ├── 0001_init/
    │   └── migration.sql
    └── 0002_add_tags_table/   ← future migration
        └── migration.sql
```

Prisma tracks which migrations have been applied via a `_prisma_migrations` table in the database. It will never re-run a migration that has already been applied.

---

## The `0001_init` migration

`0001_init/migration.sql` is the **only migration a new project needs**. It creates the entire schema from scratch:

1. All enums (`Role`, `InquiryStatus`, `EventType`, etc.)
2. All tables in dependency order (parents before children)
3. All unique constraints and indexes
4. All foreign key constraints
5. Default `FeatureFlag` rows so the admin panel works immediately

This file represents the full intended state of the database at the time the project was initialised. It should never be edited once it has been applied to any environment.

---

## Commands

All migration commands are run from the `server` directory.

### `npm run db:init`

```bash
npm run db:init
# equivalent: prisma migrate deploy && prisma generate
```

Applies all pending migrations in order and generates the Prisma client. Use this the first time you set up a new environment (local, staging, or production). It is safe to run repeatedly — Prisma skips migrations that have already been applied.

---

### `npm run db:setup`

```bash
npm run db:setup
# equivalent: npm run db:init && npm run db:seed
```

Initialises the database **and** inserts seed data. This is the all-in-one command for getting a fully working database on a fresh environment.

---

### `npm run db:migrate`

```bash
npm run db:migrate
# equivalent: prisma migrate dev
```

Used during **local development only**. When you edit `schema.prisma`, run this command to:

1. Detect the diff between the current schema and the last migration
2. Generate a new migration SQL file
3. Apply it to your local database
4. Regenerate the Prisma client

This command is interactive — it will ask you to name the migration.

---

### `npm run db:deploy`

```bash
npm run db:deploy
# equivalent: prisma migrate deploy
```

Applies all pending migrations in a **non-interactive, non-destructive** way. Use this in CI/CD pipelines and production deployments. It never generates new migrations and never asks questions.

---

### `npm run db:generate`

```bash
npm run db:generate
# equivalent: prisma generate
```

Regenerates the Prisma client to match `schema.prisma` without touching the database. Run this after pulling changes that include schema updates but where you have already applied the migration manually.

---

### `npm run db:reset`

```bash
npm run db:reset
# equivalent: prisma migrate reset --force
```

**Development only.** Drops the entire database, recreates it from scratch by replaying all migrations in order, and re-runs the seed script.

Use this when:
- Your local database is in a broken state
- You want a completely clean slate during development

**Never run this against a staging or production database.**

---

### `npm run db:studio`

```bash
npm run db:studio
# equivalent: prisma studio
```

Opens Prisma Studio, a browser-based GUI for browsing and editing database records. Useful for inspecting data during development.

---

### `npm run db:seed`

```bash
npm run db:seed
# equivalent: tsx prisma/seed.ts
```

Inserts the default admin user and demo content. The seed script is idempotent — it checks for existing records before inserting so it is safe to run more than once.

---

## Creating a new migration

When you need to change the schema, follow these steps.

### 1. Edit `schema.prisma`

Make your changes to the Prisma schema file. For example, adding a column:

```prisma
model BlogPost {
  // existing fields ...
  featuredUntil DateTime?   // ← new column
}
```

### 2. Generate the migration

```bash
cd server
npm run db:migrate
```

Prisma will ask you to name the migration. Use a short, descriptive, snake_case name that describes what changed:

```
Enter a name for the new migration: add_blog_featured_until
```

This creates:

```
migrations/
└── 0002_add_blog_featured_until/
    └── migration.sql
```

### 3. Review the generated SQL

Open the new `migration.sql` and verify it contains exactly what you expected. Prisma generates correct SQL in most cases, but always confirm before committing.

### 4. Commit both files

```bash
git add server/prisma/schema.prisma
git add server/prisma/migrations/0002_add_blog_featured_until/
git commit -m "db: add BlogPost.featuredUntil column"
```

The migration file must be committed alongside the schema change. Other developers and production deployments depend on it.

---

## Applying migrations in production

In production, migrations are applied with `db:deploy`. This command is safe to include in a deploy script or CI/CD pipeline.

```bash
# Typical production deploy sequence
cd server
npm install
npm run db:deploy   # applies any new migrations
npm run build       # compiles TypeScript
npm start           # starts the server
```

`db:deploy` will:

- Connect to the database using `DATABASE_URL`
- Check the `_prisma_migrations` table for unapplied migrations
- Apply each unapplied migration in order
- Skip migrations that have already been applied

If a migration fails, Prisma marks it as failed in `_prisma_migrations` and stops. The database is left in the state it was before the failed migration started (each migration runs inside a transaction).

---

## Migration rules

Follow these rules to keep migrations safe and reproducible.

**Never edit a migration file after it has been applied to any environment.**
Once `0001_init` has been deployed to production (or any other environment), it must never be changed. If you need to change the schema, create a new migration.

**Never delete a migration file.**
Prisma uses the full history of migrations to determine what needs to be applied. Deleting a migration will cause errors on any environment that has not yet applied it.

**Always commit migration files.**
Migration files are part of the codebase, not build artefacts. They must be in version control.

**Use `db:migrate` locally, `db:deploy` in production.**
`migrate dev` generates migrations and is interactive. `migrate deploy` applies migrations and is non-interactive. Using `migrate dev` in production is not supported.

**Name migrations clearly.**
The migration directory name is the only human-readable identifier. Use names like `add_blog_featured_until`, `remove_legacy_events_table`, `index_visitor_ip` rather than generic names like `update1` or `fix`.

---

## How Prisma tracks applied migrations

Prisma creates a `_prisma_migrations` table in your database the first time a migration is applied. Each row records:

- Migration name
- Checksum of the SQL file
- Applied timestamp
- Whether it succeeded or failed

If you run `db:deploy` on a database that already has all migrations applied, Prisma does nothing. If the checksum of an already-applied migration has changed (i.e. the file was edited), Prisma will error and refuse to proceed.

---

## Environment summary

| Command | Local dev | Staging | Production |
|---|---|---|---|
| `db:init` | ✅ First-time setup | ✅ First-time setup | ✅ First-time setup |
| `db:setup` | ✅ First-time + seed | ✅ Optional | ❌ Do not seed prod |
| `db:migrate` | ✅ Schema changes | ❌ | ❌ |
| `db:deploy` | ✅ After pulling | ✅ Deploys | ✅ Deploys |
| `db:reset` | ✅ Clean slate | ❌ | ❌ Never |
| `db:seed` | ✅ Demo data | Optional | ❌ Do not seed prod |
