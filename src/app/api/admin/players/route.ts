import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await tokenMiddleware(req);
    const players = await getAllPlayers();
    return SuccessResponse({
      data: players,
      message: "Players fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
