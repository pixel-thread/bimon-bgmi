import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { prisma } from "../src/lib/db/prisma/index";
import { logger } from "@/src/utils/logger";

const players: Omit<Prisma.PlayerCreateInput, "user">[] = [
  {
    isBanned: false,
    balance: 100,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 21,
        deaths: 46,
        kills: 117,
        kd: 2.57,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 200,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 25,
        deaths: 40,
        kills: 74,
        kd: 1.85,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 150,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "ULTRA_NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 15,
        deaths: 30,
        kills: 56,
        kd: 1.87,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 120,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 12,
        deaths: 24,
        kills: 32,
        kd: 1.33,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 300,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "ULTRA_PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 9,
        deaths: 18,
        kills: 24,
        kd: 1.33,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 85,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 18,
        deaths: 36,
        kills: 46,
        kd: 1.28,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 90,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 2,
        deaths: 4,
        kills: 4,
        kd: 1,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 110,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 20,
        deaths: 40,
        kills: 33,
        kd: 0.82,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 130,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "ULTRA_PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 23,
        deaths: 46,
        kills: 25,
        kd: 0.54,
        createdAt: new Date(),
      },
    },
  },
  {
    isBanned: false,
    balance: 140,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        wins: 18,
        deaths: 36,
        kills: 15,
        kd: 0.42,
        createdAt: new Date(),
      },
    },
  },
];

const users = Array.from({ length: players.length }).map((_, i) => ({
  email: `test${i}@example.com`,
  clerkId: `clerk-test-${i}`,
  userName: Math.random().toString(36).slice(2),
  role: "PLAYER" as const,
}));

async function main() {
  console.log("Seeding data...");
  const season = await prisma.season.create({
    data: {
      description: "This is the 2023 season",
      createdBy: "SEED",
      name: "2023 Season",
      startDate: new Date(2023, 0, 1),
    },
  });

  await prisma.tournament.create({
    data: {
      name: "2023 Tournament",
      startDate: new Date(2023, 0, 1),
      season: { connect: { id: season.id } },
    },
  });

  console.log("Created season and tournament");

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    const playerData = players[i];

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        clerkId: userData.clerkId,
        userName: userData.userName,
        role: userData.role,
        isEmailLinked: true,
        isVerified: true,
        player: { create: playerData },
      },
      include: { player: { include: { playerStats: true } } },
    });

    console.log("Created user with player and stats:", {
      userId: user.id,
      playerId: user.player?.id,
      playerStatsId: user.player?.playerStats?.id,
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
