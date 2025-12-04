import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.UserWhereUniqueInput;
  data: Prisma.UserUpdateInput;
};
export async function updateUser({ where, data }: Props) {
  return await prisma.user.update({
    where,
    data,
    include: {
      player: {
        include: { characterImage: true, playerBanned: true, uc: true },
      },
    },
  });
}
