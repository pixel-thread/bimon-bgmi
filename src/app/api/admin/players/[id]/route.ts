import { deletePlayer } from "@/src/services/player/deletePlayer";
import { getPlayerById } from "@/src/services/player/getPlayerById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

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
