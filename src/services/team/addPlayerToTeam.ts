import { prisma } from "@/src/lib/db/prisma";

type Props = {
  teamId: string;
  matchId: string;
  playerId: string;
};

export async function addPlayerToTeam({ teamId, playerId, matchId }: Props) {
  return await prisma.$transaction(async (tx) => {
    const team = await tx.team.findUnique({ where: { id: teamId } });

    if (!team) {
      throw new Error("Team not found");
    }

    // Connect player to team
    await tx.team.update({
      where: { id: teamId },
      data: { players: { connect: { id: playerId } } },
    });

    // Get the selected match to find its creation date (for ordering)
    const selectedMatch = await tx.match.findUnique({
      where: { id: matchId },
    });

    if (!selectedMatch) {
      throw new Error("Match not found");
    }

    // Get ALL matches for this tournament that were created at or after the selected match
    // This ensures the player is added to the current match and all subsequent matches
    const allMatches = await tx.match.findMany({
      where: {
        tournamentId: team.tournamentId || undefined,
        seasonId: team.seasonId || undefined,
        createdAt: { gte: selectedMatch.createdAt },
      },
      orderBy: { createdAt: "asc" },
    });

    // Add player stats for each match from the selected match onwards
    for (const match of allMatches) {
      // Find or create TeamStats for this match
      let teamStat = await tx.teamStats.findFirst({
        where: {
          teamId: teamId,
          matchId: match.id,
        },
      });

      if (!teamStat) {
        teamStat = await tx.teamStats.create({
          data: {
            teamId: teamId,
            matchId: match.id,
            seasonId: team.seasonId,
            tournamentId: team.tournamentId,
          },
        });
      }

      // Connect player to team stats
      await tx.player.update({
        where: { id: playerId },
        data: {
          teamStats: { connect: { id: teamStat.id } },
        },
      });

      // Create TeamPlayerStats for this match
      const existingPlayerStats = await tx.teamPlayerStats.findUnique({
        where: {
          playerId_teamId_matchId: {
            playerId: playerId,
            teamId: teamId,
            matchId: match.id,
          },
        },
      });

      if (!existingPlayerStats) {
        await tx.teamPlayerStats.create({
          data: {
            teamId: teamId,
            matchId: match.id,
            seasonId: team.seasonId || "",
            playerId: playerId,
            teamStatsId: teamStat.id,
            kills: 0,
            deaths: 1,
          },
        });
      }

      // Create MatchPlayerPlayed for this match
      const existingMatchPlayed = await tx.matchPlayerPlayed.findFirst({
        where: {
          matchId: match.id,
          playerId: playerId,
          teamId: teamId,
        },
      });

      if (!existingMatchPlayed) {
        await tx.matchPlayerPlayed.create({
          data: {
            matchId: match.id,
            playerId: playerId,
            tournamentId: team.tournamentId || "",
            seasonId: team.seasonId || "",
            teamId: teamId,
          },
        });
      }
    }

    // Initialize or update PlayerStats for this season
    // Count total matches played by this player in this season
    const totalMatchesPlayed = allMatches.length;

    await tx.playerStats.upsert({
      where: {
        seasonId_playerId: {
          playerId: playerId,
          seasonId: team.seasonId || "",
        },
      },
      create: {
        playerId: playerId,
        seasonId: team.seasonId || "",
        kills: 0,
        deaths: totalMatchesPlayed,
      },
      update: {
        deaths: { increment: totalMatchesPlayed },
      },
    });

    return team;
  });
}

