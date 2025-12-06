import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";
import { clientClerk } from "@/src/lib/clerk/client";

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
  const kdRatio = kills / deaths;

  if (kdRatio >= 1.7) {
    return "legend";
  } else if (kdRatio >= 1.5) {
    return "ultra pro";
  } else if (kdRatio >= 1.0) {
    return "pro";
  } else if (kdRatio >= 0.5) {
    return "noob";
  } else if (kdRatio >= 0.2) {
    return "ultra noob";
  } else {
    return "bot";
  }
}

// Type for Clerk user data used in search
type ClerkUserInfo = {
  imageUrl: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export async function GET(req: NextRequest) {
  try {
    await tokenMiddleware(req);

    const page = req.nextUrl.searchParams.get("page") || "1";
    const search = req.nextUrl.searchParams.get("search") || "";
    const tier = req.nextUrl.searchParams.get("tier") || "All";

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

    // Fetch Clerk user info in batch (images, email, name for search)
    const clerkIds = players.map((p) => p.user?.clerkId).filter(Boolean) as string[];
    const clerkUserMap = new Map<string, ClerkUserInfo>();

    try {
      // Fetch users from Clerk in batches
      if (clerkIds.length > 0) {
        const clerkUsers = await clientClerk.users.getUserList({
          userId: clerkIds,
          limit: 100,
        });
        clerkUsers.data.forEach((user) => {
          const primaryEmail = user.emailAddresses.find(
            (e) => e.id === user.primaryEmailAddressId
          )?.emailAddress || user.emailAddresses[0]?.emailAddress || null;

          clerkUserMap.set(user.id, {
            imageUrl: user.imageUrl || null,
            email: primaryEmail,
            firstName: user.firstName || null,
            lastName: user.lastName || null,
          });
        });
      }
    } catch (error) {
      console.error("Failed to fetch Clerk user info:", error);
    }

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

        const clerkInfo = player?.user?.clerkId ? clerkUserMap.get(player.user.clerkId) : null;

        return {
          id: player.id,
          clerkId: player?.user?.clerkId || null,
          isBanned: player.isBanned,
          userName: player?.user?.userName,
          uc: player.uc?.balance || 0,
          matches: matches,
          kd: playerKd.toFixed(2) || 0,
          category: getKdRank(
            playerStats.reduce((acc, curr) => acc + curr.kills, 0),
            playerStats.reduce((acc, curr) => acc + curr.deaths, 0),
          ),
          imageUrl: clerkInfo?.imageUrl || null,
          email: clerkInfo?.email || null,
          firstName: clerkInfo?.firstName || null,
          lastName: clerkInfo?.lastName || null,
        };
      });
    } else {
      data = players.map((player) => {
        const totalKills = player.playerStats.reduce((acc, curr) => acc + curr.kills, 0);
        const totalDeaths = player.playerStats.reduce((acc, curr) => acc + curr.deaths, 0);
        const playerKd = totalDeaths > 0 ? totalKills / totalDeaths : 0;

        const clerkInfo = player?.user?.clerkId ? clerkUserMap.get(player.user.clerkId) : null;

        return {
          id: player.id,
          clerkId: player?.user?.clerkId || null,
          isBanned: player.isBanned,
          uc: player.uc?.balance || 0,
          userName: player?.user?.userName,
          matches: player?.matchPlayerPlayed.length,
          kd: playerKd.toFixed(2) || 0,
          category: getKdRank(
            player.playerStats.reduce((acc, curr) => acc + curr.kills, 0),
            player.playerStats.reduce((acc, curr) => acc + curr.deaths, 0),
          ),
          imageUrl: clerkInfo?.imageUrl || null,
          email: clerkInfo?.email || null,
          firstName: clerkInfo?.firstName || null,
          lastName: clerkInfo?.lastName || null,
        };
      });
    }

    // Apply search filter (search by username, email, firstName, lastName)
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter((player) => {
        const userName = player.userName?.toLowerCase() || "";
        const email = player.email?.toLowerCase() || "";
        const firstName = player.firstName?.toLowerCase() || "";
        const lastName = player.lastName?.toLowerCase() || "";
        const fullName = `${firstName} ${lastName}`.trim();

        return (
          userName.includes(searchLower) ||
          email.includes(searchLower) ||
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          fullName.includes(searchLower)
        );
      });
    }

    // Filter by tier/category
    if (tier && tier !== "All") {
      data = data.filter((player) => player.category.toLowerCase() === tier.toLowerCase());
    }

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

    // Remove sensitive fields before sending to client (keep for search but don't expose)
    const sanitizedData = data.map(({ email, firstName, lastName, clerkId, ...rest }) => rest);

    // Apply pagination to the sanitized data
    const paginatedData = paginate({ array: sanitizedData, pageSize: 10, pageNumber: parseInt(page) });

    return SuccessResponse({
      data: paginatedData,
      message: "Players fetched successfully",
      meta: getMeta({ total: data.length, currentPage: page }),
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
