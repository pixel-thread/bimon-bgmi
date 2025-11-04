import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await tokenMiddleware(req);
    const query = req.nextUrl.searchParams;
    const page = query.get("page") || "1";
    let seasonId = query.get("season");
    let where: Prisma.PlayerWhereInput = {
      isBanned: false,
      seasons: { some: { id: seasonId || "" } },
    };

    if (seasonId === "all") {
      where = { isBanned: false };
    }

    const [players, total] = await getAllPlayers({
      include: { playerStats: { include: { matches: true } }, user: true },
      page,
      where,
    });

    const data = players.map((player) => {
      return {
        id: player.id,
        isBanned: player.isBanned,
        category: player.category,
        userName: player?.user?.userName,
        matches:
          player?.playerStats?.find((val) => val.seasonId === seasonId)?.matches
            .length ?? 0,
      };
    });
    return SuccessResponse({
      data: data,
      message: "Players fetched successfully",
      meta: getMeta({ total: total, currentPage: page }),
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
