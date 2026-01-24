// Script to add a new rule about participation-based prize distribution
// Run with: npx tsx scripts/add-participation-rule.ts

import { PrismaClient } from '../src/lib/db/prisma/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('Adding participation-based prize distribution rule...');

    // Get the highest order value
    const maxOrderRule = await prisma.rule.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
    });

    const newOrder = (maxOrderRule?.order ?? 0) + 1;

    const rule = await prisma.rule.create({
        data: {
            title: '🎮 Fair Play: Participation-Based Prize Distribution',
            content: `**Prizes are now distributed based on match participation!**

Players who miss matches receive reduced prizes, while committed players who attend all matches receive bonuses.

**How it works:**
• Your prize share is adjusted based on how many matches you played
• If you play all matches, you may receive a bonus from absent teammates
• If you miss matches, a portion of your prize goes to teammates who showed up

**Example (Trio team, 6 matches, 300 UC prize):**
| Player | Matches | Result |
|--------|---------|--------|
| Player A | 6/6 | 122 UC (+22 bonus) |
| Player B | 6/6 | 122 UC (+22 bonus) |
| Player C | 2/6 | 56 UC (-44 penalty) |

**Note:** We use a 50% softened penalty, so absent players still receive a fair portion of the prize.

**Be present, play together, and win together! 🏆**`,
            order: newOrder,
            createdBy: 'system',
        },
    });

    console.log('✅ Rule created successfully!');
    console.log(`   ID: ${rule.id}`);
    console.log(`   Title: ${rule.title}`);
    console.log(`   Order: ${rule.order}`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
