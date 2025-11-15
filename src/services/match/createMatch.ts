import { prisma } from "@/src/lib/db/prisma";
import { getTeamByTournamentId } from "../team/getTeamByTournamentId";

type Props = {
  data: {
    tournamentId: string;
    seasonId: string;
  };
};

export async function createMatch({ data }: Props) {
  return await prisma.$transaction(
    async (tx) => {
      // Step 1: Create the match with minimal required fields
      const match = await tx.match.create({
        data: {
          tournamentId: data.tournamentId,
          seasonId: data.seasonId,
        },
      });

      // Step 2: Fetch teams related to this tournament (or however you get teams)
      const teams = await getTeamByTournamentId({
        tournamentId: data.tournamentId,
      });

      for (const team of teams) {
        // Step 4: Create team stats
        await tx.team.update({
          where: { id: team.id },
          data: { matches: { connect: { id: match.id } } },
        });

        const teamStats = await tx.teamStats.create({
          data: {
            teamId: team.id,
            matchId: match.id,
            seasonId: data.seasonId,
            tournamentId: data.tournamentId,
          },
        });

        // Step 5: Create team player stats
        if (team.players && team.players.length > 0) {
          for (const player of team.players) {
            await tx.teamPlayerStats.create({
              data: {
                teamId: team.id || "",
                matchId: match.id || "",
                seasonId: data.seasonId,
                playerId: player.id || "",
                teamStatsId: teamStats.id || "",
              },
            });
            await tx.player.update({
              where: { id: player.id },
              data: { matches: { connect: { id: match.id } } },
            });

            await tx.matchPlayerPlayed.create({
              data: {
                matchId: match.id || "",
                playerId: team.players[0].id || "",
                tournamentId: data.tournamentId,
                seasonId: data.seasonId,
                teamId: team.id,
              },
            });
          }
        }
      }

      return match;
    },
    {
      maxWait: 10000, // Max wait to connect to Prisma (10 seconds)
      timeout: 30000, // Transaction timeout (30 seconds)
    },
  );
}
