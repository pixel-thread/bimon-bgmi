import { prisma } from "../src/lib/db/prisma/index";

async function main() {
  console.log("Seeding data...");

  // Array of example users to seed
  const users = Array.from({ length: 50 }).map((_, i) => ({
    email: `bob${i}@example.com`,
    clerkId: `clerk-bob-${i}`,
    userName: Math.random().toString(36).slice(2),
    role: "PLAYER" as any,
  }));

  for (const userData of users) {
    // Create User
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        clerkId: userData.clerkId,
        userName: userData.userName,
        role: userData.role,
        isEmailLinked: true,
        isVerified: true,

        // Nested create of Player with PlayerStats
        player: {
          create: {
            category: "NOOB", // default category
            playerStats: {
              create: {
                matches: Math.floor(Math.random() * 100),
                wins: Math.floor(Math.random() * 100),
                deaths: Math.floor(Math.random() * 100),
                kills: Math.floor(Math.random() * 100),
                kd: Math.floor(Math.random() * 100),
              },
            },
          },
        },
      },
      include: {
        player: {
          include: {
            playerStats: true,
          },
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
