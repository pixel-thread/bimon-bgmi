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
export async function createUserIfNotExistInDB({ data }: ClerkUser) {
  let activeSeason = await getActiveSeason();
  try {
    return await prisma.$transaction(
      async (tx) => {
        if (!activeSeason) {
          activeSeason = await prisma.season.create({
            data: {
              startDate: new Date(),
              description: "DEFAULT",
              name: "DEFAULT",
              createdBy: "DEFAULT",
            },
          });
        }

        const user = await tx.user.create({
          data: {
            userName: data.userName,
            clerkId: data.clerkId,
            createdBy: data.createdBy,
            email: data.email,
            player: {
              create: { seasons: { connect: { id: activeSeason?.id || "" } } },
            },
          },
          include: { player: true },
        });

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
