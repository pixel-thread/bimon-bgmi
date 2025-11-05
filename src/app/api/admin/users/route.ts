import { getAllUsers } from "@/src/services/user/getAllUsers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await superAdminMiddleware(req);
    const users = await getAllUsers();
    return SuccessResponse({
      data: users,
      message: "Users fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
