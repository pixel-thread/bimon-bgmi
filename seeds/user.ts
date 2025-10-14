import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { prisma } from "../src/lib/db/prisma/index";

const players: Omit<Prisma.PlayerCreateInput, "user">[] = [
  {
    id: "uuid-1",
    isBanned: false,
    balance: 100,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 10,
        wins: 2,
        deaths: 5,
        kills: 20,
        kd: 4.0,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-2",
    isBanned: false,
    balance: 200,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 50,
        wins: 25,
        deaths: 10,
        kills: 150,
        kd: 15.0,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-3",
    isBanned: false,
    balance: 150,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "ULTRA_NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 20,
        wins: 5,
        deaths: 15,
        kills: 30,
        kd: 2.0,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-4",
    isBanned: false,
    balance: 120,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 40,
        wins: 10,
        deaths: 20,
        kills: 80,
        kd: 4.0,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-5",
    isBanned: false,
    balance: 300,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "ULTRA_PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 70,
        wins: 30,
        deaths: 40,
        kills: 200,
        kd: 5.0,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-6",
    isBanned: false,
    balance: 85,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 25,
        wins: 12,
        deaths: 12,
        kills: 60,
        kd: 5.0,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-7",
    isBanned: false,
    balance: 90,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 15,
        wins: 7,
        deaths: 10,
        kills: 40,
        kd: 4.0,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-8",
    isBanned: false,
    balance: 110,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 60,
        wins: 20,
        deaths: 30,
        kills: 140,
        kd: 4.67,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-9",
    isBanned: false,
    balance: 130,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "ULTRA_PRO",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 90,
        wins: 50,
        deaths: 20,
        kills: 250,
        kd: 12.5,
        createdAt: new Date(),
      },
    },
  },
  {
    id: "uuid-10",
    isBanned: false,
    balance: 140,
    banReason: "",
    bannedAt: null,
    banDuration: 0,
    category: "NOOB",
    createdAt: new Date(),
    playerStats: {
      create: {
        matches: 45,
        wins: 18,
        deaths: 25,
        kills: 100,
        kd: 4.0,
        createdAt: new Date(),
      },
    },
  },
];

const users = Array.from({ length: players.length }).map((_, i) => ({
  email: `bob${i}@example.com`,
  clerkId: `clerk-bob-${i}`,
  userName: Math.random().toString(36).slice(2),
  role: "PLAYER" as const,
}));

async function main() {
  console.log("Seeding data...");

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
        player: {
          create: playerData,
        },
      },
      include: {
        player: {
          include: { playerStats: true },
        },
      },
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
