import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import {
  calculatePlayerPoints,
  getKdRank,
} from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);

    const searchQuery = req.nextUrl.searchParams;
    const matchId = searchQuery.get("match") || "";
    const id = (await params).id;

    // How many matches back to compare for position changes (default: 2)
    const compareMatches = parseInt(searchQuery.get("compareMatches") || "2", 10);

    const tournament = await getTournamentById({ id: id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }
    const seasonId = tournament.seasonId;

    const [teams, _] = await getTeamByTournamentId({
      tournamentId: id,
      page: "all",
    });

    // mapping data
    let data;
    const isAllMatches = matchId === "all" || matchId === "";

    if (!isAllMatches) {
      data = teams?.map((team) => {
        const teamStats = team.teamStats.find((val) => val.matchId === matchId);
        // Use filter to get ALL player stats for this match, not just one
        const teamPlayerStats = team.teamPlayerStats.filter(
          (val) => val.matchId === matchId,
        );
        const teamPlayers = team.players.map((player) => {
          const playerStats = player.playerStats.find(
            (val) => val.seasonId === seasonId,
          );
          const category = getKdRank(
            playerStats?.kills || 0,
            playerStats?.deaths || 0,
          );
          return {
            id: player.id,
            name: player.user.userName,
            displayName: player.user.displayName,
            category: category,
          };
        });

        // Sum kills from all players in this match
        const kills = teamPlayerStats.reduce((a, b) => a + b.kills, 0);
        const deaths = teamPlayerStats.reduce((a, b) => a + b.deaths, 0);
        const teamPosition = teamStats?.position || 0;
        const pts = calculatePlayerPoints(teamPosition, 0);
        const total = kills + pts;
        // Count chicken dinners (1st place finishes)
        const wins = teamPosition === 1 ? 1 : 0;
        const teamName = team.players
          .map((player) => player.user.displayName || player.user.userName)
          .join("_");
        return {
          id: team.id,
          name: teamName,
          matches: team.matches,
          size: team.players.length,
          slotNo: team.teamNumber + 1,
          kills: kills,
          deaths: deaths,
          position: teamPosition,
          pts: pts,
          total: total,
          wins: wins,
          players: teamPlayers,
          teamPlayerStats: teamPlayerStats, // Include for bulk edit dialog
        };
      });
    } else {
      // OPTIMIZED: For "all" matches - use data already fetched by getTeamByTournamentId
      // Removed redundant prisma.teamStats.findMany() call

      const { prisma } = await import("@/src/lib/db/prisma");

      // Get all team IDs for the groupBy query
      const teamIds = teams?.map((t) => t.id) || [];

      // Single aggregation query for kills - this is the only additional query needed
      const groupedKills = await prisma.teamPlayerStats.groupBy({
        where: {
          teamId: { in: teamIds },
        },
        by: ["teamId"],
        _sum: {
          kills: true,
        },
      });

      // Create a map of teamId -> kills for O(1) lookup
      const killsMap = new Map(
        groupedKills.map((g) => [g.teamId, g._sum?.kills || 0])
      );

      data = teams?.map((team) => {
        const teamPlayers = team.players.map((player) => {
          const playerStats = player.playerStats.find(
            (val) => val.seasonId === seasonId,
          );
          const category = getKdRank(
            playerStats?.kills || 0,
            playerStats?.deaths || 0,
          );
          return {
            id: player.id,
            name: player.user.userName,
            displayName: player.user.displayName,
            category: category,
          };
        });

        // Get kills from the groupBy map (O(1) lookup)
        const totalKills = killsMap.get(team.id) || 0;

        // Use already-fetched teamStats from getTeamByTournamentId
        // No need for separate prisma.teamStats.findMany query!
        const teamStatsList = team.teamStats || [];
        const totalPts = teamStatsList.reduce((acc, stat) => {
          return acc + calculatePlayerPoints(stat.position, 0);
        }, 0);

        // Count chicken dinners (1st place finishes)
        const wins = teamStatsList.filter((stat) => stat.position === 1).length;

        const total = totalPts + totalKills;
        const teamName = team.players
          .map((player) => player.user.displayName || player.user.userName)
          .join("_");
        return {
          id: team.id,
          name: teamName,
          matches: team.matches,
          size: team.players.length,
          slotNo: team.teamNumber + 1,
          kills: totalKills,
          deaths: 0,
          position: 0,
          pts: totalPts,
          total: total,
          wins: wins,
          players: teamPlayers,
        };
      });
    }

    // Calculate position changes for "all" matches view
    if (isAllMatches && data && data.length > 0) {
      const { prisma } = await import("@/src/lib/db/prisma");

      // Sort current data by total points (descending) to determine current rankings
      const sortedData = [...data].sort((a, b) => {
        // Use same tiebreaker logic: total > wins > pts > kills
        if (b.total !== a.total) return b.total - a.total;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.pts !== a.pts) return b.pts - a.pts;
        return b.kills - a.kills;
      });

      // Create a map of teamId -> current rank
      const currentRankMap = new Map<string, number>();
      sortedData.forEach((team, idx) => {
        currentRankMap.set(team.id, idx + 1);
      });

      // Get all matches for this tournament directly
      const tournamentMatches = await prisma.match.findMany({
        where: { tournamentId: id },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });

      if (tournamentMatches.length > compareMatches) {
        // Get IDs of the last N matches to exclude
        const matchIdsToExclude = tournamentMatches.slice(0, compareMatches).map(m => m.id);

        // Calculate standings WITHOUT the last N matches
        const previousData = teams?.map((team) => {
          // Filter out the last N matches stats
          const teamStatsExcludingLast = (team.teamStats || []).filter(
            (stat) => !matchIdsToExclude.includes(stat.matchId)
          );

          // Get kills excluding last N matches
          const playerStatsExcludingLast = (team.teamPlayerStats || []).filter(
            (stat) => !matchIdsToExclude.includes(stat.matchId)
          );
          const previousKills = playerStatsExcludingLast.reduce((a, b) => a + b.kills, 0);

          const previousPts = teamStatsExcludingLast.reduce((acc, stat) => {
            return acc + calculatePlayerPoints(stat.position, 0);
          }, 0);

          const previousWins = teamStatsExcludingLast.filter((stat) => stat.position === 1).length;

          return {
            id: team.id,
            total: previousPts + previousKills,
            pts: previousPts,
            kills: previousKills,
            wins: previousWins,
          };
        }) || [];

        // Sort previous standings
        const previousSorted = [...previousData].sort((a, b) => {
          if (b.total !== a.total) return b.total - a.total;
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.pts !== a.pts) return b.pts - a.pts;
          return b.kills - a.kills;
        });

        // Create map of teamId -> previous rank
        const previousRankMap = new Map<string, number>();
        previousSorted.forEach((team, idx) => {
          previousRankMap.set(team.id, idx + 1);
        });

        // Add positionChange to each team
        data = sortedData.map((team, idx) => {
          const currentRank = idx + 1;
          const previousRank = previousRankMap.get(team.id);
          // positive = moved up, negative = moved down
          const positionChange = previousRank ? previousRank - currentRank : 0;

          return {
            ...team,
            positionChange,
          };
        });
      } else {
        // Not enough matches to compare, just add positionChange: 0 to sorted data
        data = sortedData.map((team) => ({ ...team, positionChange: 0 }));
      }
    }

    return SuccessResponse({
      data: data,
      message: "Teams fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
