import { prisma } from "@/src/lib/db/prisma";

type Props = {
  data: {
    tournamentId: string;
    seasonId: string;
  };
};

/**
 * Creates a match and processes all teams in parallel for optimal performance.
 * Uses batch operations to minimize database round-trips.
 */
export async function createMatch({ data }: Props) {
  // Create match
  const match = await prisma.match.create({
    data: {
      tournamentId: data.tournamentId,
      seasonId: data.seasonId,
    },
  });

  // Fetch all teams for this tournament
  const teams = await prisma.team.findMany({
    where: { tournamentId: data.tournamentId },
    select: {
      id: true,
      players: { select: { id: true } },
    },
  });

  // Process all teams in parallel for better performance
  await Promise.all(
    teams.map(async (team) => {
      await prisma.$transaction(async (tx) => {
        // Create TeamStats
        const teamStats = await tx.teamStats.create({
          data: {
            teamId: team.id,
            matchId: match.id,
            seasonId: data.seasonId,
            tournamentId: data.tournamentId,
          },
        });

        // Connect team to match
        await tx.team.update({
          where: { id: team.id },
          data: { matches: { connect: { id: match.id } } },
        });

        if (team.players && team.players.length > 0) {
          const playerIds = team.players.map((p) => p.id);

          // Bulk create teamPlayerStats, matchPlayerPlayed, and connect players in parallel
          await Promise.all([
            tx.teamPlayerStats.createMany({
              data: playerIds.map((playerId) => ({
                teamId: team.id,
                matchId: match.id,
                seasonId: data.seasonId,
                playerId,
                teamStatsId: teamStats.id,
                kills: 0,
                deaths: 1,
              })),
            }),
            tx.matchPlayerPlayed.createMany({
              data: playerIds.map((playerId) => ({
                matchId: match.id,
                playerId,
                tournamentId: data.tournamentId,
                seasonId: data.seasonId,
                teamId: team.id,
              })),
            }),
            // Process all player updates in parallel instead of sequentially
            ...playerIds.map((playerId) =>
              tx.player.update({
                where: { id: playerId },
                data: { matches: { connect: { id: match.id } } },
              })
            ),
            ...playerIds.map((playerId) =>
              tx.playerStats.upsert({
                where: {
                  seasonId_playerId: { playerId, seasonId: data.seasonId },
                },
                create: { playerId, seasonId: data.seasonId, kills: 0, deaths: 1 },
                update: { deaths: { increment: 1 } },
              })
            ),
          ]);
        }
      });
    })
  );

  return match;
}
