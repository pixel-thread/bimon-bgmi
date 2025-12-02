import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};

export async function deleteTeamById({ id }: Props) {
  return await prisma.$transaction(async (tx) => {
    await tx.teamPlayerStats.deleteMany({ where: { teamId: id } });

    await tx.teamStats.deleteMany({ where: { teamId: id } });

    return await tx.team.delete({ where: { id } });
  });
}
