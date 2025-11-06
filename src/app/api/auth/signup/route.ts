import { createUser } from "@/src/services/user/createUser";
import { getUserByUserName } from "@/src/services/user/getUserByUserName";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { registerSchema } from "@/src/utils/validation/auth/register";

export async function POST(req: Request) {
  try {
    const superUser = await superAdminMiddleware(req);
    const body = registerSchema.parse(await req.json());
    const existingUser = await getUserByUserName({ userName: body.userName });
    if (existingUser) {
      return ErrorResponse({
        data: existingUser,
        message: "User already exists by this username",
        status: 400,
      });
    }
    const user = await createUser({
      data: {
        ...body,
        createdBy: superUser?.id,
      },
    });
    return SuccessResponse({
      data: user,
      message: "User created successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
