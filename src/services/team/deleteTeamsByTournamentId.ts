import { prisma } from "@/src/lib/db/prisma";

type Props = {
  tournamentId: string;
};
export async function deleteTeamByTournamentId({ tournamentId }: Props) {
  return prisma.team.deleteMany({ where: { tournamentId } });
}
