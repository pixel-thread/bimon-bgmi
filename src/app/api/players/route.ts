import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";
import { getKdRank } from "@/src/utils/categoryUtils";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  try {
    // Run auth first (lightweight for GET requests)
    await tokenMiddleware(req);

    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const search = req.nextUrl.searchParams.get("search") || "";
    const tier = req.nextUrl.searchParams.get("tier") || "All";
    const seasonId = req.nextUrl.searchParams.get("season") || "all";
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "kd";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") || "desc";

    // Build where clause - push as much filtering to DB as possible
    const where: Prisma.PlayerWhereInput = {
      user: { isOnboarded: true },
    };

    if (seasonId !== "all") {
      where.playerStats = { some: { seasonId } };
    }

    if (sortBy === "banned") {
      where.isBanned = true;
    }

    // Database-level search
    if (search) {
      where.OR = [
        { user: { userName: { contains: search, mode: "insensitive" } } },
        { user: { displayName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get active season for checking current-season RP
    const activeSeason = await prisma.season.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    const activeSeasonId = activeSeason?.id ?? null;

    // Fetch players with optimized includes
    const players = await prisma.player.findMany({
      where,
      select: {
        id: true,
        isBanned: true,
        customProfileImageUrl: true,
        characterImageId: true,
        user: {
          select: {
            userName: true,
            displayName: true,
            imageUrl: true,
          },
        },
        uc: {
          select: {
            balance: true,
          },
        },
        characterImage: {
          select: {
            publicUrl: true,
            isAnimated: true,
            isVideo: true,
            thumbnailUrl: true,
          },
        },
        royalPasses: {
          select: { id: true, seasonId: true },
        },
        playerStats: {
          where: seasonId !== "all" ? { seasonId } : undefined,
          select: {
            kills: true,
            deaths: true,
          },
        },
        matchPlayerPlayed: {
          where: seasonId !== "all" ? { seasonId } : undefined,
          select: { id: true },
        },
      },
    });

    // Transform to response format
    let data = players.map((player) => {
      const kills = player.playerStats.reduce((acc, s) => acc + s.kills, 0);
      const deaths = player.playerStats.reduce((acc, s) => acc + s.deaths, 0);
      const matches = player.matchPlayerPlayed.length;
      const kd = deaths > 0 ? kills / deaths : 0;
      const category = getKdRank(kills, deaths);

      // Use cached Clerk image URL from database (no API call needed)
      const cachedImageUrl = player.user?.imageUrl || null;

      return {
        id: player.id,
        isBanned: player.isBanned,
        userName: player.user?.userName || "",
        displayName: player.user?.displayName || null,
        uc: player.uc?.balance || 0,
        matches,
        deaths,
        kills,
        kd: kd.toFixed(2),
        category,
        imageUrl: cachedImageUrl,
        profileImageUrl: player.customProfileImageUrl || cachedImageUrl,
        // Only show character image if player has RP for current season
        hasCurrentSeasonRP: activeSeasonId
          ? player.royalPasses.some(rp => rp.seasonId === activeSeasonId)
          : player.royalPasses.length > 0,
        characterImageUrl: (player.characterImageId && player.characterImageId !== "none" &&
          (activeSeasonId
            ? player.royalPasses.some(rp => rp.seasonId === activeSeasonId)
            : player.royalPasses.length > 0))
          ? player.characterImage?.publicUrl || null
          : null,
        isAnimated: (activeSeasonId
          ? player.royalPasses.some(rp => rp.seasonId === activeSeasonId)
          : player.royalPasses.length > 0) ? (player.characterImage?.isAnimated || false) : false,
        isVideo: (activeSeasonId
          ? player.royalPasses.some(rp => rp.seasonId === activeSeasonId)
          : player.royalPasses.length > 0) ? (player.characterImage?.isVideo || false) : false,
        thumbnailUrl: (activeSeasonId
          ? player.royalPasses.some(rp => rp.seasonId === activeSeasonId)
          : player.royalPasses.length > 0) ? (player.characterImage?.thumbnailUrl || null) : null,
        hasRoyalPass: player.royalPasses.length > 0,
        _kd: kd,
      };
    });

    // Filter by tier (must be done in JS since tier is computed)
    if (tier && tier !== "All") {
      data = data.filter((p) => p.category.toLowerCase() === tier.toLowerCase());
    }

    // Sort
    data.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortBy) {
        case "kd": aVal = a._kd; bVal = b._kd; break;
        case "kills": aVal = a.kills; bVal = b.kills; break;
        case "matches": aVal = a.matches; bVal = b.matches; break;
        case "balance": aVal = a.uc; bVal = b.uc; break;
        default: aVal = a._kd; bVal = b._kd;
      }
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    // Calculate aggregates before pagination
    const totalBalance = data.reduce((acc, p) => acc + p.uc, 0);
    const negativeBalance = data.filter((p) => p.uc < 0).reduce((acc, p) => acc + p.uc, 0);
    const totalCount = data.length;

    // Paginate
    const startIndex = (page - 1) * PAGE_SIZE;
    const paginatedData = data.slice(startIndex, startIndex + PAGE_SIZE);

    // Apply thumbnail optimization and remove internal fields
    const sanitizedData = paginatedData.map(({ _kd, ...rest }, index) => {
      const globalIndex = startIndex + index;
      if (globalIndex >= 3 && rest.isAnimated && rest.thumbnailUrl) {
        return { ...rest, characterImageUrl: rest.thumbnailUrl, isAnimated: false };
      }
      return rest;
    });

    return SuccessResponse({
      data: sanitizedData,
      message: "Players fetched successfully",
      meta: {
        ...getMeta({ total: totalCount, currentPage: page.toString() }),
        totalBalance,
        negativeBalance,
      },
    });
  } catch (error) {
    console.error("Players API error:", error);
    return handleApiErrors(error);
  }
}
