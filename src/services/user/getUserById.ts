import { prisma } from "@/src/lib/db/prisma";

export async function getUserById({ id }: { id: string }) {
  return prisma.user.findUnique({ where: { id: id } });
}
