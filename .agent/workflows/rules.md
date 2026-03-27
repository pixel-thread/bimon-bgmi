---
description: Core rules and guidelines for the AI assistant working on this project
---

# Project Rules

## Database Push — All 3 Games
When running `prisma db push` or any schema migration, **always push to ALL 3 databases**:

```bash
# Use DIRECT_URL (pooled connection hangs for db push)

# BGMI
DATABASE_URL="postgresql://postgres.tgggoqxtsdiihkdnnyxt:BIMONLl1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" npx prisma db push

# PES
DATABASE_URL="postgresql://postgres.svbdazapxgujekqnwtwz:lRwMQioGddNcGXLg@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" npx prisma db push

# Free Fire
DATABASE_URL="postgresql://postgres.cebofvqlcdncsvypvalt:BIMONLANGg1.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" npx prisma db push
```

If `prisma db push` shows a data loss warning, use raw SQL instead:
```bash
psql "<DIRECT_URL>" -c 'ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "columnName" TYPE DEFAULT value;'
```

## Database Queries
- `prisma db execute --stdin` does **NOT** return SELECT results — use `psql "$DIRECT_URL"` instead.
- Prisma implicit M2M join tables: `_ModelAToModelB` (alphabetical), columns `"A"` and `"B"`.

## General
- The `.env` file has all 3 database URLs. Only one set is active (uncommented) at a time.
- For `prisma db push`, always use: `source .env && DATABASE_URL="$DIRECT_URL" npx prisma db push`
- Vercel auto-deploys from `main` — always push schema BEFORE deploying code that uses new columns.
