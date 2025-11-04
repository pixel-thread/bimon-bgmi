import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import {
  calculatePlayerPoints,
  getKdRank,
} from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { logger } from "@/src/utils/logger";
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
    const teams = await getTeamByTournamentId({ tournamentId: id });
    // mapping data
    const data = teams?.map((team) => {
      const teamStats = team.teamStats.find((val) => val.matchId === matchId);

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
      const kills = teamStats?.kills || 0;
      const pts = calculatePlayerPoints(team.position, kills);
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
        kills: teamStats?.kills || 0,
        deaths: teamStats?.deaths || 0,
        position: team.position,
        pts: pts,
        total: total,
        players: teamPlayers,
      };
    });

    return SuccessResponse({
      data: data,
      message: "Teams fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
