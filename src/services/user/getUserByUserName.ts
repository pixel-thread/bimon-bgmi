import { prisma } from "@/src/lib/db/prisma";

export async function getUserByUserName({ userName }: { userName: string }) {
  return prisma.user.findUnique({ where: { userName: userName } });
}
