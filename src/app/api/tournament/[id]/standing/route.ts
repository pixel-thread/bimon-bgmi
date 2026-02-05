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
          displayName: player.user.displayName,
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
              displayName: p.user.displayName,
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

    // Calculate position changes (only for "all" view with more than 1 match)
    let dataWithPositionChange = sortedData.map((team, idx) => ({
      ...team,
      currentRank: idx + 1,
      positionChange: 0, // Default: no change
    }));

    if (matchId === "all" && teamsStats.length > 0) {
      // Get all unique match IDs and find the last match by createdAt
      const matchIds = [...new Set(teamsStats.map((ts) => ts.matchId))];

      if (matchIds.length > 1) {
        // Get match creation dates to find the last match
        const matchesWithDates = await prisma.match.findMany({
          where: { id: { in: matchIds } },
          select: { id: true, createdAt: true },
        });

        // Sort matches by createdAt descending to find the latest one
        const sortedMatches = matchesWithDates.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastMatchId = sortedMatches[0]?.id;

        if (lastMatchId) {
          // Calculate standings WITHOUT the last match
          const previousTeamAggregates = new Map<string, {
            teamId: string;
            totalKills: number;
            placementPoints: number;
            chickenDinners: number;
            total: number;
          }>();

          // Get kills excluding last match
          const previousKillsStats = await prisma.teamPlayerStats.groupBy({
            where: {
              teamId: { in: teamsStats.map((team) => team.teamId) },
              matchId: { not: lastMatchId },
            },
            by: ["teamId"],
            _sum: { kills: true },
          });
          const previousKillsMap = new Map(
            previousKillsStats.map((g) => [g.teamId, g._sum?.kills || 0])
          );

          // Aggregate team stats excluding the last match
          for (const teamStat of teamsStats) {
            if (teamStat.matchId === lastMatchId) continue; // Skip last match

            const existing = previousTeamAggregates.get(teamStat.teamId);
            const placementPts = calculatePlayerPoints(teamStat.position, 0);
            const isChickenDinner = teamStat.position === 1;

            if (existing) {
              existing.placementPoints += placementPts;
              existing.chickenDinners += isChickenDinner ? 1 : 0;
              existing.total = existing.placementPoints + existing.totalKills;
            } else {
              const kills = previousKillsMap.get(teamStat.teamId) || 0;
              previousTeamAggregates.set(teamStat.teamId, {
                teamId: teamStat.teamId,
                totalKills: kills,
                placementPoints: placementPts,
                chickenDinners: isChickenDinner ? 1 : 0,
                total: placementPts + kills,
              });
            }
          }

          // Sort previous standings using tiebreaker
          const previousStandings = Array.from(previousTeamAggregates.values())
            .sort((a, b) => compareTiebreaker(a as TeamRankingData, b as TeamRankingData));

          // Create a map of teamId -> previous rank
          const previousRankMap = new Map<string, number>();
          previousStandings.forEach((team, idx) => {
            previousRankMap.set(team.teamId, idx + 1);
          });

          // Calculate position change for each team
          dataWithPositionChange = sortedData.map((team, idx) => {
            const currentRank = idx + 1;
            const previousRank = previousRankMap.get(team.teamId);

            // positionChange: positive = moved up, negative = moved down
            // If team wasn't in previous standings (new team), show no change
            const positionChange = previousRank ? previousRank - currentRank : 0;

            return {
              ...team,
              currentRank,
              positionChange,
              previousRank: previousRank || null,
            };
          });
        }
      }
    }

    return SuccessResponse({
      data: dataWithPositionChange,
      message: "Out Standing fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
