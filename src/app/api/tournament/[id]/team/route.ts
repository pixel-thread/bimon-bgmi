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
    if (matchId !== "all") {
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

        const teamStats = team.teamStats.filter(
          (val) => val.seasonId === seasonId && val.teamId === team.id,
        );
        const teamPlayerStats = team.teamPlayerStats.find(
          (val) => val.seasonId === seasonId && val.teamId === team.id,
        );

        const groupStats = teamStats.map((stat) => {
          const kills = teamPlayerStats?.kills || 0;
          const pts = calculatePlayerPoints(stat.position, 0); // Calculate points based on position
          const total = kills + pts;
          return {
            ...stat, // Keep all original fields
            kills,
            pts, // Add calculated points
            total, // Add total score
          };
        });

        const kills = groupStats.reduce((acc, val) => acc + val.kills, 0);
        const pts = groupStats.reduce((acc, val) => acc + val.pts, 0);
        const total = pts + kills;
        const teamName = team.players
          .map((player) => player.user.userName)
          .join("_");
        return {
          id: team.id,
          name: teamName,
          matches: team.matches,
          size: team.players.length,
          slotNo: team.teamNumber + 1,
          kills: kills,
          deaths: 0,
          position: 0,
          pts: pts,
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
