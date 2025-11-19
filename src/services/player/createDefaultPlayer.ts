import { prisma } from "@/src/lib/db/prisma";
type Props = {
  id: string;
};
export async function createDefaultPlayer({ id }: Props) {
  return await prisma.player.create({
    data: {
      isBanned: false,
      category: "NOOB",
      user: { connect: { id: id } },
    },
  });
}
