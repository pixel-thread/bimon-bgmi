import { deleteTournamentById } from "@/src/services/tournament/deleteTournamentById";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { updateTournament } from "@/src/services/tournament/updateTournament";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { tournamentSchema } from "@/src/utils/validation/tournament";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await adminMiddleware(req);
    const id = (await params).id;
    const tournament = await getTournamentById({ id });
    return SuccessResponse({ data: tournament });
  } catch (error) {
    return handleApiErrors(error);
  }
}
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;
    const body = tournamentSchema
      .pick({ name: true, fee: true })
      .parse(await req.json());
    const tournamentExist = await getTournamentById({ id });
    if (!tournamentExist) {
      return ErrorResponse({
        message: "tournament does not exist",
        status: 404,
      });
    }

    const updatedTournament = await updateTournament({
      data: {
        id: tournamentExist.id,
        startDate: tournamentExist.startDate,
        name: body.name,
        fee: body.fee,
      },
    });
    return SuccessResponse({
      data: updatedTournament,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await adminMiddleware(req);
    const id = (await params).id;
    const tournament = await deleteTournamentById({ id });
    return SuccessResponse({ data: tournament });
  } catch (error) {
    return handleApiErrors(error);
  }
}
