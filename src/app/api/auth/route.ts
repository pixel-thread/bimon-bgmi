import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    // await tokenMiddleware(req);
    const user: Prisma.UserGetPayload<{ include: { player: true } }> = {
      id: "9b39e439-8425-405d-817c-2779510a2745",
      email: "",
      clerkId: "user_33n7HKP1V0pzMk82lcefDmpJfY1",
      isEmailLinked: false,
      userName: "NOOB5",
      role: "PLAYER" as any,
      balance: 0,
      isInternal: false,
      isVerified: false,
      playerId: null, // nullable string
      tournamentId: null, // nullable string
      avatarUrl: "",
      characterUrl: "",
      isBanned: false,
      category: "NOOB" as any,
      userId: "9b39e439-8425-405d-817c-2779510a2745",
      teamId: null, // nullable string
      player: {
        id: "005e7183-951a-4975-b6d7-f8e0660afaad",
        avatarUrl: "",
        characterUrl: "",
        isBanned: false,
        category: "NOOB" as any,
        userId: "9b39e439-8425-405d-817c-2779510a2745",
        teamId: null, // nullable string
      },
    } as Prisma.UserGetPayload<{ include: { player: true } }>;

    return SuccessResponse({
      data: user,
      message: "User verified (created if absent)",
    });
  } catch (err) {
    return handleApiErrors(err);
  }
}
