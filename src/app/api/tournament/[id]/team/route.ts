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
        const teamPlayerStats = team.teamPlayerStats.find(
          (val) => val.seasonId === seasonId || val.matchId === matchId,
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
            category: category,
          };
        });

        const kills = teamPlayerStats?.kills || 0;
        const teamPosition = teamStats?.position || 0;
        const pts = calculatePlayerPoints(teamPosition, 0);
        const total = kills + pts;
        const teamName = team.players
          .map((player) => player.user.userName)
          .join("_");
        return {
          id: team.id,
          name: teamName,
          matches: team.matches,
          size: team.players.length,
          slotNo: team.teamNumber + 1,
          kills: teamPlayerStats?.kills || 0,
          deaths: teamPlayerStats?.deaths || 0,
          position: teamPosition,
          pts: pts,
          total: total,
          players: teamPlayers,
        };
      });
    } else {
      // For "all" matches, fetch data the same way as standing API
      const { prisma } = await import("@/src/lib/db/prisma");

      // Get all team stats for this tournament (same as standing API)
      const allTeamStats = await prisma.teamStats.findMany({
        where: { tournamentId: id },
        include: {
          teamPlayerStats: true,
          team: {
            include: { matches: true, players: { include: { user: true } } },
          },
        },
      });



      // Aggregate kills per team using groupBy (same as standing API)
      const teamIds = teams?.map((t) => t.id) || [];
      const groupedKills = await prisma.teamPlayerStats.groupBy({
        where: {
          teamId: { in: teamIds },
        },
        by: ["teamId"],
        _sum: {
          kills: true,
        },
      });



      // Create a map of teamId -> kills
      const killsMap = new Map(
        groupedKills.map((g) => [g.teamId, g._sum?.kills || 0])
      );

      // Group teamStats by teamId for pts calculation
      const teamStatsMap = new Map<string, typeof allTeamStats>();
      for (const stat of allTeamStats) {
        const existing = teamStatsMap.get(stat.teamId) || [];
        existing.push(stat);
        teamStatsMap.set(stat.teamId, existing);
      }



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
            category: category,
          };
        });

        // Get kills from the groupBy map
        const totalKills = killsMap.get(team.id) || 0;

        // Get team stats for this team and calculate pts
        const teamStatsList = teamStatsMap.get(team.id) || [];
        const totalPts = teamStatsList.reduce((acc, stat) => {
          return acc + calculatePlayerPoints(stat.position, 0);
        }, 0);



        const total = totalPts + totalKills;
        const teamName = team.players
          .map((player) => player.user.userName)
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
