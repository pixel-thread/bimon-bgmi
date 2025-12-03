import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";

type PaginateProps = {
  array: any[];
  pageSize: number;
  pageNumber: number;
};

function paginate({ array, pageSize, pageNumber }: PaginateProps) {
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return array.slice(startIndex, endIndex);
}

// Example usage
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
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "kd";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";

    let where: Prisma.PlayerWhereInput = {
      playerStats: { some: { seasonId } },
    };

    if (seasonId === "all") {
      where = {};
    }

    const [players, total] = await getAllPlayers({
      page: "all",
      where,
    });

    let data;

    if (seasonId !== "all") {
      data = players.map((player) => {
        const playerStats = player.playerStats.filter(
          (value) => value.seasonId === seasonId,
        );
        const totalKills = playerStats.reduce((acc, curr) => acc + curr.kills, 0);
        const totalDeaths = playerStats.reduce((acc, curr) => acc + curr.deaths, 0);
        const playerKd = totalDeaths > 0 ? totalKills / totalDeaths : 0;
        const matches =
          player?.matchPlayerPlayed.filter(
            (value) => value.seasonId === seasonId,
          ).length || 0;
        return {
          id: player.id,
          isBanned: player.isBanned,
          userName: player?.user?.userName,
          uc: player.uc?.balance || 0,
          matches: matches,
          kd: playerKd.toFixed(2) || 0,
          category: getKdRank(
            playerStats.reduce((acc, curr) => acc + curr.kills, 0),
            playerStats.reduce((acc, curr) => acc + curr.deaths, 0),
          ),
        };
      });
    } else {
      data = players.map((player) => {
        const totalKills = player.playerStats.reduce((acc, curr) => acc + curr.kills, 0);
        const totalDeaths = player.playerStats.reduce((acc, curr) => acc + curr.deaths, 0);
        const playerKd = totalDeaths > 0 ? totalKills / totalDeaths : 0;
        return {
          id: player.id,
          isBanned: player.isBanned,
          uc: player.uc?.balance || 0,
          userName: player?.user?.userName,
          matches: player?.matchPlayerPlayed.length,
          kd: playerKd.toFixed(2) || 0,
          category: getKdRank(
            player.playerStats.reduce((acc, curr) => acc + curr.kills, 0),
            player.playerStats.reduce((acc, curr) => acc + curr.deaths, 0),
          ),
        };
      });
    }

    // Get sort parameters

    // Sort the data
    data.sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "kd":
          aValue = parseFloat(a.kd) || 0;
          bValue = parseFloat(b.kd) || 0;
          break;
        case "kills":
          aValue = a.kills || 0;
          bValue = b.kills || 0;
          break;
        case "matches":
          aValue = a.matches || 0;
          bValue = b.matches || 0;
          break;
        case "balance":
          aValue = a.uc || 0;
          bValue = b.uc || 0;
          break;
        default:
          aValue = parseFloat(a.kd) || 0;
          bValue = parseFloat(b.kd) || 0;
      }

      if (sortOrder === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return SuccessResponse({
      data:
        seasonId === "all"
          ? paginate({ array: data, pageSize: 1, pageNumber: parseInt(page) })
          : data,
      message: "Players fetched successfully",
      meta: getMeta({ total: total, currentPage: page }),
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
