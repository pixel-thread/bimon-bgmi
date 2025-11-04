import { getPlayerStatsByPlayerId } from "@/src/services/player/getPlayerStats";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const playerId = (await params).id;
    const seasonId = req.nextUrl.searchParams.get("season") || "";
    const playerStats = await getPlayerStatsByPlayerId({ playerId, seasonId });
    return SuccessResponse({ data: playerStats });
  } catch (error) {
    handleApiErrors(error);
  }
}
