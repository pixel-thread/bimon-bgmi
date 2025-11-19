import { getPollById } from "@/src/services/polls/getPollById";
import { togglePollStatus } from "@/src/services/polls/togglePollStatus";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(
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

    const deletedPoll = await togglePollStatus({ id });
    return SuccessResponse({
      data: deletedPoll,
      message: "Poll toggled successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
