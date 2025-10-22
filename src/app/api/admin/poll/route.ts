import { createPolls } from "@/src/services/polls/createPolls";
import { getPollByTournamentId } from "@/src/services/polls/getPollByTournamentId";
import { getPolls } from "@/src/services/polls/getPolls";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { pollSchema } from "@/src/utils/validation/poll";

export async function GET(req: Request) {
  try {
    await superAdminMiddleware(req);

    const polls = await getPolls({
      include: { options: true, tournament: true },
      orderBy: { createdAt: "desc" }, // newest first
    });

    return SuccessResponse({
      data: polls,
      status: 200,
      message: "Polls fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function POST(req: Request) {
  try {
    await superAdminMiddleware(req);

    const body = pollSchema.omit({ id: true }).parse(await req.json());

    const isTournamentExist = await getTournamentById({
      id: body.tournamentId,
    });

    if (!isTournamentExist) {
      return ErrorResponse({
        message: "Tournament not found",
        status: 404,
      });
    }
    const isPollExist = await getPollByTournamentId({
      tournamentId: body.tournamentId,
    });

    if (isPollExist) {
      return ErrorResponse({
        message: "Poll already exist for this tournament",
        status: 400,
      });
    }
    const polls = await createPolls({
      data: {
        question: body.question,
        tournament: { connect: { id: body.tournamentId } },
        options: { createMany: { data: body.options } },
        endDate: body.endDate,
      },
    });

    return SuccessResponse({
      data: polls,
      status: 200,
      message: "Polls created successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
