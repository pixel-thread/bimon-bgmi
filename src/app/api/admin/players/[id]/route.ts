import { deletePlayer } from "@/src/services/player/deletePlayer";
import { getPlayerById } from "@/src/services/player/getPlayerById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { prisma } from "@/src/lib/db/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const id = (await params).id;
    const player = await getPlayerById({ id });
    return SuccessResponse({ data: player });
  } catch (error) {
    handleApiErrors(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const id = (await params).id;
    const player = await getPlayerById({ id });

    if (!player) {
      return ErrorResponse({
        message: "Player does not exist",
        status: 404,
      });
    }

    const deleted = await deletePlayer({ where: { id } });
    return SuccessResponse({ data: deleted, message: "Player deleted" });
  } catch (error) {
    handleApiErrors(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const id = (await params).id;
    const body = await req.json();

    const player = await getPlayerById({ id });

    if (!player) {
      return ErrorResponse({
        message: "Player does not exist",
        status: 404,
      });
    }

    // Toggle UC exemption status
    if (typeof body.isUCExempt === "boolean") {
      const updated = await prisma.player.update({
        where: { id },
        data: { isUCExempt: body.isUCExempt },
        select: { id: true, isUCExempt: true, user: { select: { userName: true } } },
      });

      return SuccessResponse({
        data: updated,
        message: `UC exemption ${updated.isUCExempt ? "enabled" : "disabled"} for ${updated.user.userName}`,
      });
    }

    return ErrorResponse({
      message: "Invalid request body",
      status: 400,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
