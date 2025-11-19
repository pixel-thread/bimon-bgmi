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

    const rawData = tournamentWinners.map((winner) => {
      return {
        id: winner.id,
        tournamentId: winner.tournamentId, // Assuming this field exists on winner
        tournamentName: winner?.tournament?.name || "",
        amount: winner.amount,
        position: winner.position,
        teamName: winner.team.players
          .map((player) => player.user.userName)
          .join(", "),
      };
    });

    const groupedByTournament = rawData.reduce(
      (acc, winner) => {
        if (!acc[winner.tournamentId]) {
          acc[winner.tournamentId] = {
            tournamentId: winner.tournamentId,
            tournamentName: winner.tournamentName,
            place1: null,
            place2: null,
          };
        }

        if (winner.position === 1 && acc[winner.tournamentId].place1 === null) {
          acc[winner.tournamentId].place1 = winner;
        } else if (
          winner.position === 2 &&
          acc[winner.tournamentId].place2 === null
        ) {
          acc[winner.tournamentId].place2 = winner;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          tournamentId: string;
          tournamentName: string;
          place1: (typeof rawData)[0] | null;
          place2: (typeof rawData)[0] | null;
        }
      >,
    );

    const data = Object.values(groupedByTournament);
    return SuccessResponse({
      message: "Tournament Winners",
      data: data,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
