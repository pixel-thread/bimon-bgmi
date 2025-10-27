import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    const user = await tokenMiddleware(req);
    return SuccessResponse({
      data: user,
      message: "User verified (created if absent)",
    });
  } catch (err) {
    return handleApiErrors(err);
  }
}
