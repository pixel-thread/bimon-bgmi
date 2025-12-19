import { clientClerk } from "@/src/lib/clerk/client";
import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getActiveSeason } from "../season/getActiveSeason";

type Props = {
  data: Omit<Prisma.UserCreateInput, "clerkId"> & {
    password: string;
    email: string;
    createdBy: string;
  };
};

type ClerkUser = {
  data: Omit<Prisma.UserCreateInput, "clerkId"> & {
    password: string;
    email: string;
    createdBy: string;
    role?: string;
    clerkId: string;
  };
};

// Only Create user in our db if it doesn't exist
// NOTE: Player, UC, and PlayerStats are created during onboarding, not here
export async function createUserIfNotExistInDB({ data }: ClerkUser) {
  // Generate a temporary username for new users (will be replaced during onboarding)
  const tempUsername = `user_${data.clerkId.slice(-8)}`;

  try {
    // First, check if user with this email already exists
    if (data.email) {
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email: data.email },
        include: {
          player: {
            include: { characterImage: true, playerBanned: true, uc: true },
          },
        },
      });

      if (existingUserByEmail) {
        // User exists with this email - update their clerkId to link accounts
        const updatedUser = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: { clerkId: data.clerkId },
          include: {
            player: {
              include: { characterImage: true, playerBanned: true, uc: true },
            },
          },
        });
        return updatedUser;
      }
    }

    // Create only the User record - Player/UC/PlayerStats created during onboarding
    const user = await prisma.user.create({
      data: {
        userName: tempUsername, // Temporary username
        clerkId: data.clerkId,
        createdBy: data.createdBy,
        email: data.email || null,
        role: data.role,
        isOnboarded: false, // New users need to complete onboarding
      },
      include: {
        player: {
          include: { characterImage: true, playerBanned: true, uc: true },
        },
      },
    });

    return user;
  } catch (error) {
    throw error;
  }
}

// Full user creations
export async function createUser({ data }: Props) {
  const clerkUser = await clientClerk.users.createUser({
    password: data.password,
    username: data.userName,
    emailAddress: [data.email],
  });

  const activeSeason = await getActiveSeason();

  try {
    return await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            userName: data.userName,
            role: data.role,
            clerkId: clerkUser.id,
            createdBy: data.createdBy,
            email: data.email,
            player: {
              create: { seasons: { connect: { id: activeSeason?.id || "" } } },
            },
          },
          include: { player: true },
        });

        // Set playerId on User for consistent access
        if (user.player?.id) {
          await tx.user.update({
            where: { id: user.id },
            data: { playerId: user.player.id },
          });
        }

        await tx.uC.create({
          data: {
            user: { connect: { id: user.id } },
            player: { connect: { id: user?.player?.id || "" } },
          },
        });

        await tx.playerStats.create({
          data: {
            season: { connect: { id: activeSeason?.id || "" } },
            player: { connect: { id: user?.player?.id || "" } },
          },
        });
        return user;
      },
      {
        maxWait: 10000, // Max wait to connect to Prisma (10 seconds)
        timeout: 30000, // Transaction timeout (30 seconds)
      },
    );
  } catch (error) {
    await clientClerk.users.deleteUser(clerkUser.id);
    throw error;
  }
}
