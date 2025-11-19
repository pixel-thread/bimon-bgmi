import { prisma } from "@/src/lib/db/prisma";

export async function getAllSeasons() {
  return await prisma.season.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}
