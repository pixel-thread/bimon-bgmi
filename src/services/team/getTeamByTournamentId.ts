import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  tournamentId: string;
  include?: Prisma.TeamInclude;
};

export async function getTeamByTournamentId(
  { tournamentId, include }: Props = { include: undefined, tournamentId: "" },
): Promise<any> {
  return await prisma.team.findMany({
    where: { tournamentId },
    include,
  });
}
