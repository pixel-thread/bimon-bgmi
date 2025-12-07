import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;
    await tokenMiddleware(req);
    const search = req.nextUrl.searchParams;
    const matchId = search.get("match") || "all";
    let where: Prisma.TeamStatsWhereInput;

    if (matchId === "all") {
      where = { tournamentId: id };
    } else {
      where = {
        tournamentId: id,
        matchId: matchId,
      };
    }

    const tournament = await getTournamentById({ id: id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    const teamsStats = await prisma.teamStats.findMany({
      where,
      include: {
        teamPlayerStats: true,
        team: {
          include: { matches: true, players: { include: { user: true } } },
        },
      },
    });

    const groupTeamsStats = await prisma.teamPlayerStats.groupBy({
      where: {
        teamId: { in: teamsStats.map((team) => team.teamId) },
        // Only filter by matchId when viewing a specific match, not "all"
        ...(matchId !== "all" && { matchId }),
      },
      by: ["teamId"],
      _sum: {
        kills: true,
      },
    });

    const data1 = groupTeamsStats.map((team) => {
      const position =
        teamsStats.find((teamStats) => teamStats.teamId === team.teamId)
          ?.position || 0;
      const groupStats = teamsStats.map((stat) => {
        const kills =
          stat.teamPlayerStats.reduce(
            (acc, playerStat) => acc + playerStat.kills,
            0,
          ) || 0;
        const pts = calculatePlayerPoints(stat.position, 0); // Calculate points based on position
        const total = kills + pts;
        return {
          ...stat, // Keep all original fields
          pts, // Add calculated points
          total, // Add total score
        };
      });

      const pts = groupStats
        .filter((val) => val.teamId === team.teamId)
        .reduce((acc, stat) => acc + stat.pts, 0);
      const wins = teamsStats
        .filter((val) => val.teamId === team.teamId)
        .reduce((acc, stat) => acc + (stat.position === 1 ? 1 : 0), 0);
      const kills = team?._sum?.kills || 0;
      const total = kills + pts;
      const teamStats = teamsStats.find(
        (teamStats) => teamStats.teamId === team.teamId,
      );
      return {
        name: teamStats?.team?.name || "",
        teamId: team.teamId,
        kills: team._sum.kills,
        wins: wins,
        position: position,
        total: total,
        // When viewing a specific match, show 1; otherwise show count of matches for this team
        matches: matchId !== "all" ? 1 : teamsStats.filter(s => s.teamId === team.teamId).length,
        pts: pts,
        players: teamStats?.team?.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
        })),
      };
    });
    const sortedData = data1.sort((a, b) => b.total - a.total);
    return SuccessResponse({
      data: sortedData,
      message: "Out Standing fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
