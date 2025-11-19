import { getPollById } from "@/src/services/polls/getPollById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const id = (await params).id;

    const poll = await getPollById({
      where: { id },
      include: {
        options: true,
        playersVotes: {
          include: {
            player: { include: { characterImage: true, user: true } },
          },
        },
      },
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
