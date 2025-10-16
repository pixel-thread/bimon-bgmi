import { getPolls } from "@/src/services/polls/getPolls";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await tokenMiddleware(req);
    const polls = await getPolls({
      include: { options: true },
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
