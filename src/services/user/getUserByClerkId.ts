import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};

export async function getUserByClerkId({ id }: Props) {
  return prisma.user.findUnique({
    where: { clerkId: id },
    include: {
      player: {
        include: { characterImage: true, playerBanned: true, uc: true },
      },
    },
  });
}
