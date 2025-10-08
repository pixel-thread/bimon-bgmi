import { clientClerk } from "@/src/lib/clerk/client";
import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Omit<Prisma.UserCreateInput, "clerkId"> & { password: string };
};

export async function createUser({ data }: Props) {
  const userC = await clientClerk.users.createUser({
    password: data.password,
    username: data.userName,
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
