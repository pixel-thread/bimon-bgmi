import { getUniqueMatch } from "@/src/services/match/getMatchById";
import { updateManyTeamsStats } from "@/src/services/team/updateTeamStats";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { teamsStatsSchema } from "@/src/utils/validation/team/team-stats";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    await superAdminMiddleware(req);
    const { tournamentId, matchId, stats } = teamsStatsSchema.parse(
      await req.json(),
    );

    const tournament = await getTournamentById({ id: tournamentId });

    if (!tournament) {
      return ErrorResponse({
        message: "Tournament not found",
        status: 404,
      });
    }

    const match = await getUniqueMatch({ where: { id: matchId } });

    if (!match) {
      return ErrorResponse({
        message: "Match not found",
        status: 404,
      });
    }

    const updatedData = await updateManyTeamsStats({
      tournamentId,
      matchId,
      stats,
      seasonId: tournament?.seasonId,
    });

    return SuccessResponse({
      message: "Stats updated successfully",
      data: updatedData,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
