import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  where: Prisma.PlayerWhereUniqueInput;
};
export async function toggleBannedPlayer({ where }: Props) {
  return await prisma.$transaction(async (tx) => {
    const isPlayerExist = await tx.player.findUnique({
      where,
    });
    const isBanned = isPlayerExist?.isBanned;

    // If currently banned, we are unbanning -> set manualUnban to true to prevent auto-ban
    // If currently unbanned, we are banning -> set manualUnban to false (admin ban overrides everything, but auto-ban logic respects isBanned=true anyway)
    // Actually, if admin bans manually, we probably want it to stay banned. 
    // But the requirement says "admin and super admid can unbann manually though for each players".
    // So if admin unbans, we set manualUnban = true.

    return await tx.player.update({
      where,
      data: {
        isBanned: !isBanned,
        manualUnban: isBanned ? true : false, // If we are unbanning (was banned), set manualUnban true. If banning, set false.
      },
    });
  });
}
