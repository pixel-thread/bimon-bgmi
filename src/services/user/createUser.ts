import { clientClerk } from "@/src/lib/clerk/client";
import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Omit<Prisma.UserCreateInput, "clerkId"> & { password: string };
};
type ClerkUser = {
  clerkId: string;
  username: string;
};
export async function createUserIfNotExistInDB({
  clerkId,
  username,
}: ClerkUser) {
  return await prisma.user.create({
    data: {
      userName: username,
      clerkId: clerkId,
      player: {
        create: {
          avatarUrl: "",
          characterUrl: "",
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
    emailAddress: [],
  });
  // clerkId is injected from Clerk; not present in data
  return await prisma.user.create({
    data: {
      userName: data.userName,
      clerkId: userC.id,
      player: {
        create: {
          avatarUrl: "",
          characterUrl: "",
        },
      },
    },
    include: { player: true },
  });
}
