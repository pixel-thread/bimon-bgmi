import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { prisma } from "../src/lib/db/prisma/index";

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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
        seasonId: "",
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
  clerkId: `clerk-test-${i}`,
  userName: Math.random().toString(36).slice(2),
  role: "PLAYER" as const,
  player: players[i],
}));

async function main() {
  console.log("Seeding data...");

  console.log("Created season and tournament");

  const season = await prisma.season.create({
    data: {
      createdBy: "SEED",
      name: "2023 Season",
      startDate: new Date(2023, 0, 1),
    },
  });

  const tournament = await prisma.tournament.create({
    data: {
      name: "2023 Tournament",
      startDate: new Date(2023, 0, 1),
      season: { connect: { id: season.id } },
      createdBy: "SEED",
    },
  });

  await prisma.poll.create({
    data: {
      tournamentId: tournament.id,
      question: "What is your favorite color?",
      options: {
        createMany: {
          data: Array.from({ length: 3 }).map((_, i) => ({
            name: `Option ${i}`,
            vote: i % 2 === 0 ? "IN" : "OUT",
          })),
        },
      },
    },
  });

  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          clerkId: userData.clerkId,
          userName: userData.userName,
          role: userData.role,
          isEmailLinked: false,
          isVerified: false,
          createdBy: "SEED",
          player: {
            create: {
              seasons: { connect: { id: season.id } },
              playerStats: {
                create: {
                  season: {
                    connect: { id: season.id },
                  },
                  ...userData.player.playerStats,
                },
              },
            },
          },
        },
        include: { player: { include: { playerStats: true } } },
      });
      return user;
    });

    console.log("Created user with player and stats:", {
      userId: user.id,
      playerId: user.player?.id,
      playerStatsId: "",
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
