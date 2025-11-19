import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function POST(req: Request) {
  try {
    await superAdminMiddleware(req);
    return SuccessResponse({
      data: "",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
