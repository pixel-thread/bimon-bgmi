import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    // Use requireFullUser to load complete user data for auth context
    // This includes player, characterImage, playerBanned, uc, playerStats
    const user = await tokenMiddleware(req, { requireFullUser: true });
    return SuccessResponse({
      data: user,
      message: "User verified (created if absent)",
    });
  } catch (err) {
    return handleApiErrors(err);
  }
}
