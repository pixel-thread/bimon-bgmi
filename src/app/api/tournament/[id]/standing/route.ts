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

    // Create a map of teamId -> kills for quick lookup
    const killsMap = new Map(
      groupTeamsStats.map((g) => [g.teamId, g._sum?.kills || 0])
    );

    // Get team stats for each team with all the data needed for tiebreakers
    // Iterate over teamsStats to include ALL teams, even those without player stats
    const data1 = teamsStats.map((teamStat) => {
      const teamMatchStats = teamsStats.filter((stat) => stat.teamId === teamStat.teamId);

      // Calculate placement points (points from position, not kills)
      const placementPoints = teamMatchStats.reduce((acc, stat) => {
        return acc + calculatePlayerPoints(stat.position, 0);
      }, 0);

      // Count chicken dinners (1st place finishes)
      const chickenDinners = teamMatchStats.filter((stat) => stat.position === 1).length;

      // Total kills - lookup from killsMap, default to 0 if team has no player stats
      const totalKills = killsMap.get(teamStat.teamId) || 0;

      // Total points = placement points + kills
      const total = placementPoints + totalKills;

      // Get last match position (most recent match based on createdAt)
      const sortedByDate = [...teamMatchStats].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const lastMatchPosition = sortedByDate[0]?.position || 99;

      return {
        name: teamStat.team?.name || "",
        teamId: teamStat.teamId,
        kills: totalKills,
        wins: chickenDinners,
        position: teamStat.position || 0,
        total: total,
        // Tiebreaker fields
        chickenDinners: chickenDinners,
        placementPoints: placementPoints,
        totalKills: totalKills,
        lastMatchPosition: lastMatchPosition,
        // When viewing a specific match, show 1; otherwise show count of matches for this team
        matches: matchId !== "all" ? teamMatchStats.length : 1,
        pts: placementPoints,
        players: teamStat.team?.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
        })),
      };
    });

    // Remove duplicates (since we're iterating over teamsStats which may have multiple entries per team for "all")
    const uniqueTeams = new Map<string, any>();
    if (matchId === "all") {
      // For "all", we need to aggregate data per team
      const teamAggregates = new Map<string, {
        teamId: string;
        name: string;
        totalKills: number;
        placementPoints: number;
        chickenDinners: number;
        lastMatchPosition: number;
        matchCount: number;
        players: { id: string; name: string }[] | undefined;
      }>();

      for (const teamStat of teamsStats) {
        const existing = teamAggregates.get(teamStat.teamId);
        const kills = killsMap.get(teamStat.teamId) || 0;
        const placementPts = calculatePlayerPoints(teamStat.position, 0);
        const isChickenDinner = teamStat.position === 1;

        if (existing) {
          existing.placementPoints += placementPts;
          existing.chickenDinners += isChickenDinner ? 1 : 0;
          existing.matchCount += 1;
          // Update last match position if this match is more recent
          if (new Date(teamStat.createdAt).getTime() > existing.lastMatchPosition) {
            existing.lastMatchPosition = teamStat.position;
          }
        } else {
          teamAggregates.set(teamStat.teamId, {
            teamId: teamStat.teamId,
            name: teamStat.team?.name || "",
            totalKills: kills,
            placementPoints: placementPts,
            chickenDinners: isChickenDinner ? 1 : 0,
            lastMatchPosition: teamStat.position,
            matchCount: 1,
            players: teamStat.team?.players.map((p) => ({
              id: p.id,
              name: p.user.userName,
            })),
          });
        }
      }

      // Convert to TeamRankingData array
      for (const [, agg] of teamAggregates) {
        uniqueTeams.set(agg.teamId, {
          name: agg.name,
          teamId: agg.teamId,
          kills: agg.totalKills,
          wins: agg.chickenDinners,
          position: agg.lastMatchPosition,
          total: agg.placementPoints + agg.totalKills,
          chickenDinners: agg.chickenDinners,
          placementPoints: agg.placementPoints,
          totalKills: agg.totalKills,
          lastMatchPosition: agg.lastMatchPosition,
          matches: agg.matchCount,
          pts: agg.placementPoints,
          players: agg.players,
        });
      }
    } else {
      // For specific match, just use data1 directly
      for (const team of data1) {
        uniqueTeams.set(team.teamId, team);
      }
    }

    const finalData = Array.from(uniqueTeams.values());

    // Sort using official BGMI tiebreaker rules:
    // 1. Total points (higher is better)
    // 2. Chicken dinners (higher is better)
    // 3. Placement points (higher is better)
    // 4. Total kills (higher is better)
    // 5. Last match position (lower is better)
    const sortedData = finalData.sort(compareTiebreaker);
    return SuccessResponse({
      data: sortedData,
      message: "Out Standing fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
