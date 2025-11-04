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
  clerkId: string;
  username: string;
  role?: string;
};

export async function createUserIfNotExistInDB({
  clerkId,
  username,
  role,
}: ClerkUser) {
  const activeSeason = await getActiveSeason();
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
          seasons: { connect: { id: activeSeason?.id || "" } },
          playerStats: {
            create: {
              season: { connect: { id: activeSeason?.id || "" } },
            },
          },
        },
      },
    },
    include: { player: true },
  });
}

export async function createUser({ data }: Props) {
  const userC = await clientClerk.users.createUser({
    password: data.password,
    username: data.userName,
    emailAddress: [data.email],
  });

  const activeSeason = await getActiveSeason();

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        userName: data.userName,
        clerkId: userC.id,
        createdBy: data.createdBy,
        player: {
          create: {
            isBanned: false,
            category: "NOOB",
            characterImage: undefined,
            seasons: {
              connect: { id: activeSeason?.id || "" },
            },
          },
        },
      },
      include: { player: true },
    });

    tx.playerStats.create({
      data: {
        season: { connect: { id: activeSeason?.id || "" } },
        player: { connect: { id: user?.player?.id || "" } },
      },
    });
    return user;
  });
}
