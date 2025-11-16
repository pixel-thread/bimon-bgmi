import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";

function getKdRank(kills: number, deaths: number): string {
  if (deaths === 0) {
    // Prevent division by zero; if kills > 0 and no deaths, consider as legend
    return "bot";
  }

  const kdRatio = kills / deaths;

  if (kdRatio >= 2.5) {
    return "legend";
  } else if (kdRatio >= 2.0) {
    return "ultra pro";
  } else if (kdRatio >= 1.5) {
    return "pro";
  } else if (kdRatio >= 1.0) {
    return "noob";
  } else if (kdRatio >= 0.5) {
    return "ultra noob";
  } else if (kdRatio < 0.2) {
    return "bot";
  } else {
    return "bot";
  }
}

export async function GET(req: NextRequest) {
  try {
    await tokenMiddleware(req);

    const page = req.nextUrl.searchParams.get("page") || "1";

    let seasonId: string | undefined =
      req.nextUrl.searchParams.get("season") || "all";

    let where: Prisma.PlayerWhereInput = {
      playerStats: { some: { seasonId } },
    };

    if (seasonId === "all") {
      where = {};
    }

    const [players, total] = await getAllPlayers({
      page,
      where,
    });
    const data = players.map((player) => {
      const playerKd =
        player.playerStats.reduce((acc, curr) => acc + curr.kills, 0) /
          player.playerStats.reduce((acc, curr) => acc + curr.deaths, 0) || 0;

      return {
        id: player.id,
        isBanned: player.isBanned,
        userName: player?.user?.userName,
        matches: player?.matchPlayerPlayed.length,
        kd: playerKd.toFixed(2) || 0,
        category: getKdRank(
          player.playerStats.reduce((acc, curr) => acc + curr.kills, 0),
          player.playerStats.reduce((acc, curr) => acc + curr.deaths, 0),
        ),
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
