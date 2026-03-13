---
description: Core rules and guidelines for the AI assistant working on this project
---

# Antigravity Rules

- Don't blindly follow my requests. If I suggest something that could be improved, push back and explain better alternatives before proceeding.
- When I ask for a change, first evaluate if it's the right approach. If not, explain why and suggest what would work better.
- Be opinionated — tell me when my idea has trade-offs or risks.
- If something I ask for might break existing functionality, warn me before making the change.
- Always consider the full picture (database, API, frontend) before implementing — don't just fix one layer.
- Mobile is the primary platform. Always design mobile-first — every UI change must look good on mobile before desktop. Test layouts, font sizes, touch targets, and spacing for small screens first, then scale up for larger viewports.

# Domain Knowledge

- Tournament names like "Lehkai sngewtynnad 1" can exist across multiple seasons. They are NOT unique per season.
- When querying tournament data, always account for same-named tournaments across different seasons.
- For db push, use: `source .env && DATABASE_URL="$DIRECT_URL" npx prisma db push` (the pooled connection hangs).
- **Prisma implicit M2M tables in raw SQL**: Prisma names implicit many-to-many join tables as `_ModelAToModelB` (alphabetical order), e.g. `_PlayerToTeam` (not `_PlayerTeams`). Column `"A"` = first model's ID, `"B"` = second model's ID. Always check the migration SQL if unsure.

# Architecture Notes

- **Middleware → Proxy rename**: As of Next.js 16, `middleware.ts` was renamed to `proxy.ts`. This is a framework-level rename — the functionality is identical. Our `src/proxy.ts` uses the NextAuth v5 `auth()` wrapper for route protection. Do NOT create a `middleware.ts` file.
- **Multi-tenant game setup**: The codebase serves **3 games** from the same repo: BGMI (PUBGMI), PES (eFOOTBALL/KICKOFF), and Free Fire (BOO-YAH). The `NEXT_PUBLIC_GAME_MODE` env var (`bgmi`, `pes`, or `freefire`) controls game-specific branding, currency, and features via `src/lib/game-config.ts`. All 3 Vercel projects (`bimon-bgmi-v2`, `bimon-pes`, `bimon-boo-yah`) deploy from the same `pixel-thread/bimon-bgmi` GitHub repo.
- **Central Wallet (Neon)**: B-Coin balances are shared across all games via a central wallet database hosted on Neon. Each game's local Supabase DB stores player/team/tournament data, but wallet balances come from the shared Neon DB. Key files:
  - `prisma/wallet-schema.prisma` — Central wallet schema (CentralUser, CentralWallet, CentralTransaction)
  - `prisma.wallet.config.ts` — Separate Prisma config for the wallet DB
  - `src/lib/wallet-db.ts` — Lazy-initialized wallet client using `@prisma/adapter-pg`
  - `src/lib/wallet-service.ts` — All wallet operations (balance reads, transactions, batch fetches)
  - Wallet client generation: `prisma generate --config=prisma.wallet.config.ts`
  - The wallet Prisma client uses **Prisma 7 "client" engine** with `PrismaPg` adapter, NOT `datasources` or `datasourceUrl` constructor args.
- **Database per game**: Each game has its own Supabase PostgreSQL database. The `.env` file has all 3 connection strings — uncomment the one you need. Always use `DIRECT_URL` (port 5432) for `db push` since the pooled connection (port 6543) hangs.
