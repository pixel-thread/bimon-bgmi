import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";
import { clientClerk } from "@/src/lib/clerk/client";
import { getKdRank } from "@/src/utils/categoryUtils";

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

export async function GET(req: NextRequest) {
  try {
    await adminMiddleware(req);

    const page = req.nextUrl.searchParams.get("page") || "1";

    let seasonId: string | undefined =
      req.nextUrl.searchParams.get("season") || "all";
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "kd";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";
    const search = req.nextUrl.searchParams.get("search") || "";
    const tier = req.nextUrl.searchParams.get("tier") || "All";

    let where: Prisma.PlayerWhereInput = {
      playerStats: { some: { seasonId } },
    };

    if (seasonId === "all") {
      where = {};
    }

    // Add search filter
    if (search) {
      where = {
        ...where,
        user: {
          userName: {
            contains: search,
            mode: "insensitive",
          },
        },
      };
    }

    // If sortBy is "banned", filter to only show banned players
    if (sortBy === "banned") {
      where = {
        ...where,
        isBanned: true,
      };
    }

    const [players, total] = await getAllPlayers({
      page: "all",
      where,
    });

    // Fetch Clerk user images in batch
    const clerkIds = players.map((p) => p.user?.clerkId).filter(Boolean) as string[];
    const clerkUserMap = new Map<string, string>();

    try {
      // Fetch users from Clerk in batches
      if (clerkIds.length > 0) {
        const clerkUsers = await clientClerk.users.getUserList({
          userId: clerkIds,
          limit: 100,
        });
        clerkUsers.data.forEach((user) => {
          if (user.imageUrl) {
            clerkUserMap.set(user.id, user.imageUrl);
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch Clerk user images:", error);
    }

    let data;

    if (seasonId !== "all") {
      data = players.map((player) => {
        const playerStats = player.playerStats.filter(
          (value) => value.seasonId === seasonId,
        );
        const totalKills = playerStats.reduce((acc, curr) => acc + curr.kills, 0);
        const totalDeaths = playerStats.reduce((acc, curr) => acc + curr.deaths, 0);
        const playerKd = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
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
          kills: totalKills,
          kd: playerKd.toFixed(2) || 0,
          category: getKdRank(totalKills, totalDeaths),
          imageUrl: player?.user?.clerkId ? clerkUserMap.get(player.user.clerkId) || null : null,
        };
      });
    } else {
      data = players.map((player) => {
        const totalKills = player.playerStats.reduce((acc, curr) => acc + curr.kills, 0);
        const totalDeaths = player.playerStats.reduce((acc, curr) => acc + curr.deaths, 0);
        const playerKd = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
        return {
          id: player.id,
          isBanned: player.isBanned,
          uc: player.uc?.balance || 0,
          userName: player?.user?.userName,
          matches: player?.matchPlayerPlayed.length,
          kills: totalKills,
          kd: playerKd.toFixed(2) || 0,
          category: getKdRank(totalKills, totalDeaths),
          imageUrl: player?.user?.clerkId ? clerkUserMap.get(player.user.clerkId) || null : null,
        };
      });
    }

    // Filter by tier/category
    if (tier && tier !== "All") {
      data = data.filter((player) => player.category.toLowerCase() === tier.toLowerCase());
    }

    // Get sort parameters

    // Sort the data (skip if sortBy is "banned" since we already filtered)
    if (sortBy !== "banned") {
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
    }

    return SuccessResponse({
      data:
        seasonId === "all" && page !== "all"
          ? paginate({ array: data, pageSize: 10, pageNumber: parseInt(page) })
          : data,
      message: "Players fetched successfully",
      meta: getMeta({ total: total, currentPage: page }),
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

