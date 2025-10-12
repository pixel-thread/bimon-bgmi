import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await superAdminMiddleware(req);
    const activeSeason = await getActiveSeason();
    if (!activeSeason) {
      return ErrorResponse({ message: "No active season found" });
    }
    return SuccessResponse({ data: activeSeason, message: "Success" });
  } catch (error) {
    return handleApiErrors(error);
  }
}
