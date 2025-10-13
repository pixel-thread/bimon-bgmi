import { prisma } from "@/src/lib/db/prisma";

export async function getAllPlayers() {
  return await prisma.player.findMany({ where: { isBanned: false } });
}
