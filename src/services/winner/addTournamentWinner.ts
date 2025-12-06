import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type Props = {
  data: Prisma.TournamentWinnerCreateInput;
};

export async function addTournamentWinner({ data }: Props) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({
      where: { id: data.team.connect?.id },
      include: {
        players: { include: { user: true } },
        tournament: true,
      },
    });

    const teamPlayers = team?.players;
    if (teamPlayers) {
      for (const player of teamPlayers) {
        const amount = data.amount || 0;
        const splitAmount = amount / teamPlayers.length;
        await tx.uC.upsert({
          where: { playerId: player.id },
          create: {
            player: { connect: { id: player.id } },
            user: { connect: { id: player.user.id } },
          },
          update: { balance: { increment: splitAmount } },
        });

        await tx.transaction.create({
          data: {
            amount: splitAmount,
            type: "credit",
            description: `Tournament Prize: ${team?.tournament?.name || "Tournament"}`,
            playerId: player.id,
          },
        });
      }
    }
    await tx.tournament.update({
      where: { id: team?.tournamentId || "" },
      data: { isWinnerDeclared: true },
    });

    return await tx.tournamentWinner.create({ data });
  });
}
