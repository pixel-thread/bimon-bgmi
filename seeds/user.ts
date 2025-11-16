import { prisma } from "@/src/lib/db/prisma";
import { season1 } from "./season-1";
import { season2 } from "./season-2";
import { season3 } from "./season-3";
import { SeedUserT } from "./type";
import { clientClerk } from "@/src/lib/clerk/client";
import { v4 as uuidv4 } from "uuid";

/**
 * Sanitizes a player name to meet Clerk username requirements:
 * - No spaces
 * - Only alphanumeric characters, underscores, and hyphens
 * - Lowercase for consistency
 * - Minimum length of 3 characters (Clerk requirement)
 */
function sanitizeClerkUsername(playerName: string): string {
  // Replace spaces with underscores
  let sanitized = playerName.replace(/\s+/g, "_");
  
  // Remove all special characters except underscores and hyphens
  // Keep only alphanumeric, underscores, and hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, "");
  
  // Convert to lowercase for consistency
  sanitized = sanitized.toLowerCase();
  
  // Collapse multiple consecutive underscores or hyphens into single underscore
  sanitized = sanitized.replace(/[_-]+/g, "_");
  
  // Trim any leading/trailing underscores or hyphens
  sanitized = sanitized.replace(/^[_-]+|[_-]+$/g, "");
  
  // If empty after sanitization (e.g., only special characters), use a fallback
  if (sanitized.length === 0) {
    sanitized = "player";
  }
  
  // Ensure minimum length of 3 characters (Clerk requirement)
  // If too short after sanitization, pad with numbers
  if (sanitized.length < 3) {
    sanitized = sanitized.padEnd(3, "0");
  }
  
  // Ensure maximum length of 20 characters (Clerk limit)
  if (sanitized.length > 20) {
    sanitized = sanitized.substring(0, 20);
  }
  
  return sanitized;
}

// Function to seed data for a given season
async function seedSeason(data: SeedUserT[], seasonName: string) {
  let season = await prisma.season.findFirst({
    where: { status: "ACTIVE" },
  });

  if (season) {
    await prisma.season.update({
      where: { id: season.id },
      data: {
        status: "INACTIVE",
      },
    });
  }

  season = await prisma.season.create({
    data: {
      name: seasonName,
      startDate: new Date(),
      description: "Season 1",
      createdBy: "SEED",
    },
  });
  for (const userData of data) {
    // Create or update user
    const demoEmail = `${uuidv4()}@pixelthread.com`;
    const email = userData.email || demoEmail;
    // Sanitize player name to meet Clerk username requirements
    const sanitizedUsername = sanitizeClerkUsername(userData.playerName);
    const clerkUser = await clientClerk.users.createUser({
      password: "123Clashofclan@",
      username: sanitizedUsername,
      emailAddress: [email],
    });

    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: {
        id: userData.id,
        email: demoEmail || undefined,
        clerkId: clerkUser?.id || "",
        isEmailLinked: userData.isEmailLinked || false,
        isVerified: userData.isVerified || false,
        userName: userData.userName || userData.playerName,
        role: "PLAYER",
        balance: userData.balance || 0,
      },
    });

    // Create or update player
    const player = await prisma.player.create({
      data: {
        isBanned: false,
        seasons: { connect: { id: season.id } },
        user: { connect: { id: user.id } },
      },
    });

    // Create or update player stats
    await prisma.playerStats.create({
      data: {
        kills: userData.stats.kills || 0,
        deaths: userData.stats.deaths || 0,
        season: { connect: { id: season.id } },
        player: { connect: { id: player.id } },
      },
    });
  }
}

async function main() {
  await seedSeason(season1, "season-1");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
