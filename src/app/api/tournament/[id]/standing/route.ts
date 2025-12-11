import { prisma } from "@/src/lib/db/prisma";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { compareTiebreaker, TeamRankingData } from "@/src/utils/tournamentTiebreaker";
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

    // Get team stats for each team with all the data needed for tiebreakers
    const data1: TeamRankingData[] = groupTeamsStats.map((team) => {
      const teamMatchStats = teamsStats.filter((stat) => stat.teamId === team.teamId);

      // Calculate placement points (points from position, not kills)
      const placementPoints = teamMatchStats.reduce((acc, stat) => {
        return acc + calculatePlayerPoints(stat.position, 0);
      }, 0);

      // Count chicken dinners (1st place finishes)
      const chickenDinners = teamMatchStats.filter((stat) => stat.position === 1).length;

      // Total kills
      const totalKills = team?._sum?.kills || 0;

      // Total points = placement points + kills
      const total = placementPoints + totalKills;

      // Get last match position (most recent match based on createdAt)
      const sortedByDate = [...teamMatchStats].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastMatchPosition = sortedByDate[0]?.position || 99;

      const teamData = teamsStats.find((stat) => stat.teamId === team.teamId);

      return {
        name: teamData?.team?.name || "",
        teamId: team.teamId,
        kills: totalKills,
        wins: chickenDinners,
        position: teamMatchStats[0]?.position || 0,
        total: total,
        // Tiebreaker fields
        chickenDinners: chickenDinners,
        placementPoints: placementPoints,
        totalKills: totalKills,
        lastMatchPosition: lastMatchPosition,
        // When viewing a specific match, show 1; otherwise show count of matches for this team
        matches: matchId !== "all" ? teamMatchStats.length : 1,
        pts: placementPoints,
        players: teamData?.team?.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
        })),
      };
    });

    // Sort using official BGMI tiebreaker rules:
    // 1. Total points (higher is better)
    // 2. Chicken dinners (higher is better)
    // 3. Placement points (higher is better)
    // 4. Total kills (higher is better)
    // 5. Last match position (lower is better)
    const sortedData = data1.sort(compareTiebreaker);
    return SuccessResponse({
      data: sortedData,
      message: "Out Standing fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
