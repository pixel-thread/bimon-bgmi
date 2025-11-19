import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await tokenMiddleware(req);
    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
      return ErrorResponse({ message: "No active season found", status: 404 });
    }
    return SuccessResponse({ data: activeSeason, message: "Success" });
  } catch (error) {
    return handleApiErrors(error);
  }
}
