import { clientClerk } from "@/src/lib/clerk/client";
import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getActiveSeason } from "../season/getActiveSeason";

type Props = {
  data: Omit<Prisma.UserCreateInput, "clerkId"> & {
    password: string;
    email?: string;
    createdBy: string;
  };
};

type ClerkUser = {
  clerkId: string;
  username: string;
  role?: string;
};

export async function createUserIfNotExistInDB({
  clerkId,
  username,
  role,
}: ClerkUser) {
  return await prisma.user.create({
    data: {
      userName: username,
      clerkId: clerkId,
      playerId: undefined,
      role:
        role || process.env.NODE_ENV === "development"
          ? "SUPER_ADMIN"
          : "PLAYER",
      player: {
        create: {
          isBanned: false,
          category: "NOOB",
          characterImage: undefined,
        },
      },
    },
    include: { player: true },
  });
}

export async function createUser({ data }: Props) {
  const clerkUser = await clientClerk.users.createUser({
    password: data.password,
    username: data.userName,
  });

  const activeSeason = await getActiveSeason();

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        userName: data.userName,
        clerkId: clerkUser.id,
        createdBy: data.createdBy,
        email: data.email,
        player: {
          create: { seasons: { connect: { id: activeSeason?.id || "" } } },
        },
      },
      include: { player: true },
    });

    await tx.playerStats.create({
      data: {
        season: { connect: { id: activeSeason?.id || "" } },
        player: { connect: { id: user?.player?.id || "" } },
      },
    });
    return user;
  });
}
