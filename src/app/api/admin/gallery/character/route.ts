import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function POST(req: Request) {
  try {
    await adminMiddleware(req);
    return SuccessResponse({
      data: "",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
