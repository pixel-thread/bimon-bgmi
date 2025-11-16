import { getPlayerById } from "@/src/services/player/getPlayerById";
import { toggleBannedPlayer } from "@/src/services/player/toggleBannedPlayer";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const id = (await params).id;
    const isPlayerExist = await getPlayerById({ id });
    if (!isPlayerExist) {
      return ErrorResponse({ message: "Player not found" });
    }
    const bannedPlayer = await toggleBannedPlayer({ where: { id } });
    return SuccessResponse({
      data: bannedPlayer,
      message: "successfully update Banned Status",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
