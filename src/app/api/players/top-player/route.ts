import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await tokenMiddleware(req);

    const players = await getAllPlayers({ where: { isBanned: false } });

    if (!players || players.length === 0) {
      return ErrorResponse({
        message: "No players found",
        status: 404,
      });
    }

    const topPlayers = players
      .filter(
        (p) => p.playerStats?.kd !== undefined && p.playerStats?.kd !== null,
      )
      .sort((a, b) => (b.playerStats!.kd ?? 0) - (a.playerStats!.kd ?? 0))
      .slice(0, 3);

    // Swap first and second players if at least 2 exist
    if (topPlayers.length >= 2) {
      [topPlayers[0], topPlayers[1]] = [topPlayers[1], topPlayers[0]];
    }

    return SuccessResponse({
      data: topPlayers,
      message: "Top players fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
