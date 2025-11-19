import { prisma } from "@/src/lib/db/prisma";

export async function getAllTournament() {
  return await prisma.tournament.findMany();
}
