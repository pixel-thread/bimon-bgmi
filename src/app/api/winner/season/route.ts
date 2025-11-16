import { getUniqueSeason } from "@/src/services/season/getUniqueSeason";
import { getTournamentWinners } from "@/src/services/winner/getTournamentWinners";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function POST(req: Request) {
  try {
    await superAdminMiddleware(req);

    const body = await req.json();

    const isSeasonExist = await getUniqueSeason({
      where: { id: body.seasonId },
    });

    if (!isSeasonExist) {
      return ErrorResponse({ message: "Season not found" });
    }

    const tournamentWinners = await getTournamentWinners({
      where: { team: { seasonId: body.seasonId } },
    });

    const data = tournamentWinners.map((winner) => {
      return {
        id: winner.id,
        amount: winner.amount,
        position: winner.position,
        teamName: winner.team.players
          .map((player) => player.user.userName)
          .join(", "),
        teamId: winner.team.id,
      };
    });

    return SuccessResponse({
      message: "Tournament Winners",
      data: data,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
