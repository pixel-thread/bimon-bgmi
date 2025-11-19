import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await tokenMiddleware(req);

    const search = req.nextUrl.searchParams;
    const seasonId = search.get("season");

    // Build where filter for prisma query
    let where: Prisma.PlayerStatsWhereInput = {};
    if (seasonId && seasonId !== "all") {
      where = { seasonId };
    }

    // Fetch playerStats with related player info
    const playerStats = await prisma.playerStats.findMany({
      where,
      include: {
        player: {
          include: {
            user: true,
            matches: true, // corrected 'matchs' to 'matches'
            characterImage: true,
          },
        },
      },
    });

    if (!playerStats || playerStats.length === 0) {
      return ErrorResponse({
        message: "No players found",
        status: 404,
      });
    }

    // Deduplicate by player id (not playerStats id)
    const seenPlayerIds = new Set<string>();
    const uniquePlayerStats = playerStats.filter((ps) => {
      if (ps.playerId && seenPlayerIds.has(ps.playerId)) return false;
      if (ps.playerId) seenPlayerIds.add(ps.playerId);
      return true;
    });

    // Compute KD and provide fallbacks for kills and wins
    const playersWithStats = uniquePlayerStats.map((ps) => {
      const kd =
        ps.deaths && ps.deaths > 0 ? ps.kills / ps.deaths : (ps.kills ?? 0);
      return {
        ...ps,
        computedKD: kd,
        kills: ps.kills ?? 0,
        wins: 0,
      };
    });

    // Sort by KD desc, kills desc, wins desc for tie-breaking
    const topPlayers = playersWithStats
      .sort(
        (a, b) =>
          b.computedKD - a.computedKD || b.kills - a.kills || b.wins - a.wins,
      )
      .slice(0, 3);

    // Reorder so second highest is first, highest is second, third unchanged
    if (topPlayers.length === 3) {
      const [first, second, third] = topPlayers;
      topPlayers[0] = second;
      topPlayers[1] = first;
      topPlayers[2] = third;
    } else if (topPlayers.length === 2) {
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
