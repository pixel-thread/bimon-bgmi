import { clientClerk } from "@/src/lib/clerk/client";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function DELETE(req: Request) {
  try {
    await superAdminMiddleware(req);
    const users = await clientClerk.users.getUserList();
    for (const user of users.data) {
      await clientClerk.users.deleteUser(user.id);
    }
    const deletedUsers = await clientClerk.users.getUserList();
    return SuccessResponse({
      data: deletedUsers,
      message: "All users deleted successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
