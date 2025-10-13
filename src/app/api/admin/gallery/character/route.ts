import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";

export async function POST(req: Request) {
  try {
    return await superAdminMiddleware(req);
  } catch (error) {
    return handleApiErrors(error);
  }
}
