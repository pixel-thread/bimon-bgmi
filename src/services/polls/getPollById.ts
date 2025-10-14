import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};
export async function getPollById({ id }: Props) {
  return await prisma.poll.findUnique({ where: { id } });
}
