import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  include?: Prisma.TeamInclude;
  where: Prisma.TeamWhereUniqueInput;
};

export async function getTeamById({ include, where }: Props) {
  return await prisma.team.findUnique({ where, include });
}
