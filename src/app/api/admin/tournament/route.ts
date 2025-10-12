import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import { createTournament } from "@/src/services/tournament/createTournament";
import { deleteTournamentById } from "@/src/services/tournament/deleteTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { tournamentSchema } from "@/src/utils/validation/tournament";

export async function POST(req: Request) {
  try {
    const user = await superAdminMiddleware(req);
    const body = tournamentSchema.parse(await req.json());
    const activeSeason = await getActiveSeason();

    if (!activeSeason) {
      return ErrorResponse({ message: "No active season found", status: 400 });
    }

    const tournament = await createTournament({
      data: {
        ...body,
        createdBy: user.id,
        Season: { connect: { id: activeSeason.id } },
      },
    });

    return SuccessResponse({ data: tournament, message: "Success" });
  } catch (error) {
    return handleApiErrors(error);
  }
}
