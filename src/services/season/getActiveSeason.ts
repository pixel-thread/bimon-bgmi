import { prisma } from "@/src/lib/db/prisma";

export async function getActiveSeason() {
  return await prisma.season.findFirst({
    where: { status: "ACTIVE" },
  });
}
