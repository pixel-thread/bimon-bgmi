import { getAllUsers } from "@/src/services/user/getAllUsers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await superAdminMiddleware(req);
    const page = req.nextUrl.searchParams.get("page") || "1";
    const [users, total] = await getAllUsers({ page });
    return SuccessResponse({
      data: users,
      meta: getMeta({ total, currentPage: page }),
      message: "Users fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
