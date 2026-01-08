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

    return SuccessResponse({
      data: data,
      message: "Teams fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
