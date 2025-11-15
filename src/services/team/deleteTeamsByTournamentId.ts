import { prisma } from "@/src/lib/db/prisma";

type Props = {
  tournamentId: string;
};
export async function deleteTeamByTournamentId({ tournamentId }: Props) {
  return await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { tournamentId } });
    await tx.teamStats.deleteMany({ where: { tournamentId } });
    return tx.team.deleteMany({ where: { tournamentId } });
  });
}
