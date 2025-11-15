import { deletePollById } from "@/src/services/polls/deletePollById";
import { getPollById } from "@/src/services/polls/getPollById";
import { updatePollById } from "@/src/services/polls/updatePollById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { pollSchema } from "@/src/utils/validation/poll";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const id = (await params).id;
    const poll = await getPollById({
      where: { id },
      include: { options: true },
    });

    if (!poll) {
      return ErrorResponse({
        message: "Poll not found",
        status: 404,
      });
    }

    return SuccessResponse({
      data: poll,
      message: "Poll fetched successfully",
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
    await superAdminMiddleware(req);
    const id = (await params).id;
    const poll = getPollById({ where: { id }, include: { options: true } });

    if (!poll) {
      return ErrorResponse({
        message: "Poll not found",
        status: 404,
      });
    }

    const deletedPoll = await deletePollById({ id });
    return SuccessResponse({
      data: deletedPoll,
      message: "Poll deleted successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);

    const id = (await params).id;

    const poll = getPollById({ where: { id }, include: { options: true } });

    if (!poll) {
      return ErrorResponse({
        message: "Poll not found",
        status: 404,
      });
    }
    const body = pollSchema
      .omit({ tournamentId: true })
      .parse(await req.json());

    const updatedPoll = await updatePollById({
      id,
      data: {
        question: body.question,
        endDate: body.endDate,
        options: { deleteMany: {}, createMany: { data: body.options } },
        days: body.days,
      },
    });
    return SuccessResponse({
      data: updatedPoll,
      message: "Poll updated successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
