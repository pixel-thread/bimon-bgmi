import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { prisma } from "@/src/lib/db/prisma";

type Props = {
  data: Prisma.TeamCreateInput;
};

export async function createTeamByTournamentId({ data }: Props) {
  return await prisma.team.create({ data });
}
