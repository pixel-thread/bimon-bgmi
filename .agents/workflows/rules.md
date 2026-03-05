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
