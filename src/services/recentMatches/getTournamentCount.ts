import { prisma } from "@/src/lib/db/prisma";

export async function getTournamentCount() {
    return prisma.tournament.count();
}
