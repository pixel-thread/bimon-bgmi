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

# Architecture Notes

- **Middleware → Proxy rename**: As of Next.js 16, `middleware.ts` was renamed to `proxy.ts`. This is a framework-level rename — the functionality is identical. Our `src/proxy.ts` uses the NextAuth v5 `auth()` wrapper for route protection. Do NOT create a `middleware.ts` file.
- **Multi-tenant game setup**: The codebase serves both BGMI (PUBGMI) and Free Fire (BOO-YAH) from the same repo. The `NEXT_PUBLIC_GAME_MODE` env var (`bgmi` or `freefire`) controls game-specific branding, currency, and features via `src/lib/game-config.ts`. Both Vercel projects (`bimon-bgmi-v2` and `bimon-boo-yah`) deploy from the same `pixel-thread/bimon-bgmi` GitHub repo.
