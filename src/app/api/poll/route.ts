import { getPolls } from "@/src/services/polls/getPolls";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await tokenMiddleware(req);
    const query = req.nextUrl.searchParams;
    const page = query.get("page");
    const polls = await getPolls({
      where: { isActive: true },
      include: { options: true },
      page,
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
