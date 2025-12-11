import { prisma } from "@/src/lib/db/prisma";
type Props = {
  id: string;
};
export async function createDefaultPlayer({ id }: Props) {
  return await prisma.$transaction(async (tx) => {
    const player = await tx.player.create({
      data: {
        isBanned: false,
        category: "NOOB",
        user: { connect: { id: id } },
      },
    });

    // Set playerId on User for consistent access
    await tx.user.update({
      where: { id: id },
      data: { playerId: player.id },
    });

    return player;
  });
}
