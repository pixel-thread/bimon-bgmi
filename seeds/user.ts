import { prisma } from "@/src/lib/db/prisma";
import { season1 } from "./season-1";
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
  const season = await prisma.season.create({
    data: {
      name: "Season 1",
      startDate: new Date("2023-08-01"),
      endDate: new Date("2023-08-31"),
      createdBy: "SEED",
      status: "INACTIVE",
    },
  });

  const season2 = await prisma.season.create({
    data: {
      name: "Season 2",
      startDate: new Date("2023-08-01"),
      endDate: new Date("2023-08-31"),
      createdBy: "SEED",
      status: "INACTIVE",
    },
  });

  const season3 = await prisma.season.create({
    data: {
      name: "Season 3",
      startDate: new Date("2023-08-01"),
      endDate: new Date("2023-08-31"),
      status: "ACTIVE",
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
      username: sanitizedUsername.toLowerCase(),
      emailAddress: [email],
    });

    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: {
        email: demoEmail || undefined,
        clerkId: clerkUser?.id || "",
        isEmailLinked: userData.isEmailLinked || false,
        isVerified: userData.isVerified || false,
        userName: userData.userName || userData.playerName,
        role: "PLAYER",
        createdBy: "SEED",
        player: {
          create: {
            isBanned: false,
            seasons: { connect: { id: season.id } },
          },
        },
      },
      include: { player: true },
    });

    console.log("Created user", user.id);

    await prisma.uC.create({
      data: {
        balance: userData.balance,
        player: { connect: { id: user?.player?.id } },
        user: { connect: { id: user?.id } },
      },
    });

    console.log("Created UC", user.id);
    // Create or update player stats
    await prisma.playerStats.create({
      data: {
        kills: userData.stats.find((val) => val.season === 1)?.kills || 0,
        deaths: userData.stats.find((val) => val.season === 1)?.deaths || 0,
        season: { connect: { id: season.id } },
        player: { connect: { id: user?.player?.id } },
      },
    });

    console.log("Created stats 1:");
    await prisma.playerStats.create({
      data: {
        kills: userData.stats.find((val) => val.season === 2)?.kills || 0,
        deaths: userData.stats.find((val) => val.season === 2)?.deaths || 0,
        season: { connect: { id: season2.id } },
        player: { connect: { id: user?.player?.id } },
      },
    });

    console.log("Created stats 2:");
    await prisma.playerStats.create({
      data: {
        kills: userData.stats.find((val) => val.season === 3)?.kills || 0,
        deaths: userData.stats.find((val) => val.season === 3)?.deaths || 0,
        season: { connect: { id: season3.id } },
        player: { connect: { id: user?.player?.id } },
      },
    });
    console.log("Created stats 3:");
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
