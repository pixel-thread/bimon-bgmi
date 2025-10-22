import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};

export async function deleteTeamById({ id }: Props) {
  return prisma.team.delete({ where: { id } });
}
