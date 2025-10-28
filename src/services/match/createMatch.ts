import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTeamByTournamentId } from "../team/getTeamByTournamentId";
import { PlayerT } from "@/src/types/player";

type Props = {
  data: {
    tournamentId: string;
    seasonId: string;
  };
};

export async function createMatch({ data }: Props) {
  return await prisma.$transaction(async (tx) => {
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
      include: { players: { include: { user: true } } },
    });

    for (const team of teams) {
      // Step 4: Create team stats
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
        await tx.teamPlayerStats.createMany({
          data: team.players.map((p: PlayerT) => ({
            playerId: p.id,
            matchId: match.id,
            teamId: team.id,
            tournamentId: data.tournamentId,
            seasonId: data.seasonId,
          })),
        });
      }
    }

    return match;
  });
}
