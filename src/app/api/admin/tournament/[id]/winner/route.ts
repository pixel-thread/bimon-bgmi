import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const id = (await params).id;
    await tokenMiddleware(req);
    let where: Prisma.TeamStatsWhereInput;
    where = { tournamentId: id };

    const tournament = await getTournamentById({ id: id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    const teamsStats = await prisma.teamStats.findMany({
      where,
      include: {
        team: {
          include: { matches: true, players: { include: { user: true } } },
        },
      },
    });

    const groupTeamsStats = await prisma.teamStats.groupBy({
      where,
      by: ["teamId"],
      _sum: {
        kills: true,
      },
      _avg: {
        position: true,
      },
    });

    const mappedData = groupTeamsStats.map((team) => {
      const position =
        teamsStats.find((teamStats) => teamStats.teamId === team.teamId)
          ?.position || 0;
      const groupStats = teamsStats.map((stat) => {
        const kills = stat.kills || 0;
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
      const kills = team?._sum?.kills || 0;
      const total = kills + pts;
      const teamStats = teamsStats.find(
        (teamStats) => teamStats.teamId === team.teamId,
      );
      return {
        name: teamStats?.team?.name || "",
        teamId: team.teamId,
        kills: team._sum.kills,
        position: position,
        total: total,
        matches: teamStats?.team?.matches.length,
        pts: pts,
        players: teamStats?.team?.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
        })),
      };
    });

    const sortedData = mappedData.sort((a, b) => b.total - a.total).slice(0, 2);

    return SuccessResponse({
      data: sortedData,
      status: 200,
      message: "Tournament winner fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
