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
    const roleParam = req.nextUrl.searchParams.get("role") || "USER";
    const searchParam = req.nextUrl.searchParams.get("search") || "";

    const where: any = {};
    if (roleParam) {
      where.role = { equals: roleParam as any };
    }
    if (searchParam) {
      where.email = { contains: searchParam, mode: "insensitive" };
    }

    const [users, total] = await getAllUsers({ page, where: Object.keys(where).length > 0 ? where : undefined });
    return SuccessResponse({
      data: users,
      meta: getMeta({ total, currentPage: page }),
      message: "Users fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
