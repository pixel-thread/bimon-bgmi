import { getUserById } from "@/src/services/user/getUserById";
import { updateUser } from "@/src/services/user/updateUser";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import z from "zod";
const schema = z.object({
  role: z.enum(["PLAYER", "ADMIN", "SUPER_ADMIN", "USER"]).default("USER"),
});
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;
    const user = await getUserById({ id });
    const body = schema.parse(await req.json());
    if (!user) {
      return ErrorResponse({
        message: "User not found",
        status: 404,
      });
    }
    const updatedRole = await updateUser({
      where: { id },
      data: {
        role: body.role,
      },
    });
    return SuccessResponse({ data: updatedRole, status: 200 });
  } catch (error) {
    return handleApiErrors(error);
  }
}
