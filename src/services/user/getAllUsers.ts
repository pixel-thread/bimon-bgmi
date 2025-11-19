import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where?: Prisma.UserWhereInput;
};
export async function getAllUsers({ where }: Props = {}) {
  return await prisma.user.findMany({ where });
}
