import { prisma } from "../src/lib/db/prisma/index"; // update path accordingly

// Mock data arrays
const users = [
  {
    userName: "Harrison",
    email: "jyrwaboys@gmail.com",
    clerkId: "mock-clerk-id-1",
    role: "PLAYER",
    isEmailLinked: true,
    isVerified: true,
  },
  {
    userName: "Alice",
    email: "alice@example.com",
    clerkId: "mock-clerk-id-2",
    role: "ADMIN",
    isEmailLinked: true,
    isVerified: true,
  },
];

const players = [
  {
    userId: "", // will fill after user creation
    category: "NOOB",
    isBanned: false,
  },
  {
    userId: "", // will fill after user creation
    category: "PRO",
    isBanned: false,
  },
];

const playerStats = [
  {
    kills: 5,
    deaths: 3,
  },
  {
    kills: 10,
    deaths: 5,
  },
];

async function main() {
  console.log("Seeding data...");

  // Ensure active season exists or create one
  let season = await prisma.season.findFirst({ where: { status: "ACTIVE" } });
  if (!season) {
    season = await prisma.season.create({
      data: {
        createdBy: "SEED",
        name: "2023 Season",
        startDate: new Date(2023, 0, 1),
        endDate: new Date(2023, 11, 31),
        status: "ACTIVE",
      },
    });
  }

  // Create users and keep track of created IDs to link players
  const createdUsers = [];
  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { userName: userData.userName },
    });

    if (!existingUser) {
      const user = await prisma.user.create({ data: userData });
      console.log(`Created user: ${user.userName}`);
      createdUsers.push(user);
    } else {
      console.log(`User exists: ${existingUser.userName}`);
      createdUsers.push(existingUser);
    }
  }

  // Create players linked to users
  const createdPlayers = [];
  for (let i = 0; i < players.length; i++) {
    // Link each player to user in createdUsers array (make sure lengths match)
    const playerData = players[i];
    playerData.userId = createdUsers[i]?.id || "";

    if (!playerData.userId) {
      console.warn("Skipping player creation due to missing userId");
      continue;
    }

    // Check if player exists by userId
    const existingPlayer = await prisma.player.findUnique({
      where: { userId: playerData.userId },
    });

    if (!existingPlayer) {
      const player = await prisma.player.create({ data: playerData });
      console.log(`Created player for userId: ${player.userId}`);
      createdPlayers.push(player);
    } else {
      console.log(`Player exists for userId: ${existingPlayer.userId}`);
      createdPlayers.push(existingPlayer);
    }
  }

  // Create player stats linked to players
