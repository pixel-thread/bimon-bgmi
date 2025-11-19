import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
type Props = {
  id: string;
  include?: Prisma.TournamentInclude;
};

export async function getTournamentById({ id, include }: Props) {
  return prisma.tournament.findUnique({
    where: { id },
    include,
  });
}
