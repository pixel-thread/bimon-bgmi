import { createTeamsByPolls } from "@/src/services/team/createTeamsByPoll";
import { deleteTeamByTournamentId } from "@/src/services/team/deleteTeamsByTournamentId";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import {
  calculatePlayerPoints,
  getKdRank,
} from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await adminMiddleware(req);

    const id = (await params).id;

    const matchId = req.nextUrl.searchParams.get("match") || "";

    const page = req.nextUrl.searchParams.get("page") || "1";

    // How many matches back to compare for position changes (default: 2)
    const compareMatches = parseInt(req.nextUrl.searchParams.get("compareMatches") || "2", 10);

    const tournament = await getTournamentById({ id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    const [teams, total] = await getTeamByTournamentId({
      tournamentId: id,
      page,
    });

    const seasonId = tournament.seasonId;

    let data;

    const isAllMatchFilter = matchId === "all" || matchId === "";

    // Filter teams to only include those that have the selected match
    // This prevents showing duplicate teams from different matches
    const filteredTeams = isAllMatchFilter
      ? teams
      : teams.filter((team) => team.matches.some((m) => m.id === matchId));

    data = filteredTeams?.map((team) => {
      const teamStats = isAllMatchFilter
        ? team.teamStats
        : team.teamStats.filter((val) => val.matchId === matchId);

      const rawTeamPlayerStats = team.teamPlayerStats;
      const teamPlayerStats = isAllMatchFilter
        ? []
        : team.teamPlayerStats.filter((val) => val.matchId === matchId);

      const position = isAllMatchFilter
        ? teamStats?.reduce((a, b) => a + b.position, 0)
        : teamStats.find((val) => val.matchId === matchId)?.position;

      const teamPlayers = team.players.map((player) => {
        const playerStats = player.playerStats.find(
          (val) => val.seasonId === seasonId,
        );

        const category = getKdRank(
          playerStats?.kills || 0,
          playerStats?.deaths || 0,
        );

        return {
          id: player.id,
          name: player.user.userName,
          displayName: player.user.displayName,
          category: category,
        };
      });

      const kills = isAllMatchFilter
        ? rawTeamPlayerStats.reduce((a, b) => a + b.kills, 0)
        : teamPlayerStats.reduce((a, b) => a + b.kills, 0);

      const deaths = isAllMatchFilter
        ? rawTeamPlayerStats.reduce((a, b) => a + b.deaths, 0)
        : teamPlayerStats.reduce((a, b) => a + b.deaths, 0);

      const teamPosition = position || 0;

      // For "all" view, calculate pts for EACH match position separately, then sum
      // For single match, calculate pts from that match's position
      const pts = isAllMatchFilter
        ? teamStats.reduce((acc, stat) => acc + calculatePlayerPoints(stat.position, 0), 0)
        : calculatePlayerPoints(teamPosition, 0);

      const total = kills + pts;

      // Count chicken dinners (1st place finishes)
      const wins = teamStats.filter((stat) => stat.position === 1).length;

      const teamName = team.players
        .map((player) => player.user.displayName || player.user.userName)
        .join("_");

      return {
        id: team.id,
        name: teamName,
        matches: team.matches,
        size: team.players.length,
        slotNo: teams.indexOf(team) + 2,
        kills: kills || 0,
        deaths: deaths || 0,
        position: teamPosition,
        pts: pts,
        total: total,
        wins: wins,
        players: teamPlayers,
        teamPlayerStats: teamPlayerStats,
      };
    });

    // Calculate position changes for "all" matches view
    if (isAllMatchFilter && data && data.length > 0) {
      const { prisma } = await import("@/src/lib/db/prisma");

      // Sort current data by total points (descending) to determine current rankings
      const sortedData = [...data].sort((a, b) => {
        // Use same tiebreaker logic: total > wins > pts > kills
        if (b.total !== a.total) return b.total - a.total;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.pts !== a.pts) return b.pts - a.pts;
        return b.kills - a.kills;
      });

      // Get all matches for this tournament directly
      const tournamentMatches = await prisma.match.findMany({
        where: { tournamentId: id },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      });

      if (tournamentMatches.length > compareMatches) {
        // Get IDs of the last N matches to exclude
        const matchIdsToExclude = tournamentMatches.slice(0, compareMatches).map(m => m.id);

        // Calculate standings WITHOUT the last N matches
        const previousData = teams?.map((team) => {
          // Filter out the last N matches stats
          const teamStatsExcludingLast = (team.teamStats || []).filter(
            (stat) => !matchIdsToExclude.includes(stat.matchId)
          );

          // Get kills excluding last N matches
          const playerStatsExcludingLast = (team.teamPlayerStats || []).filter(
            (stat) => !matchIdsToExclude.includes(stat.matchId)
          );
          const previousKills = playerStatsExcludingLast.reduce((a, b) => a + b.kills, 0);

          const previousPts = teamStatsExcludingLast.reduce((acc, stat) => {
            return acc + calculatePlayerPoints(stat.position, 0);
          }, 0);

          const previousWins = teamStatsExcludingLast.filter((stat) => stat.position === 1).length;

          return {
            id: team.id,
            total: previousPts + previousKills,
            pts: previousPts,
            kills: previousKills,
            wins: previousWins,
          };
        }) || [];

        // Sort previous standings
        const previousSorted = [...previousData].sort((a, b) => {
          if (b.total !== a.total) return b.total - a.total;
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.pts !== a.pts) return b.pts - a.pts;
          return b.kills - a.kills;
        });

        // Create map of teamId -> previous rank
        const previousRankMap = new Map<string, number>();
        previousSorted.forEach((team, idx) => {
          previousRankMap.set(team.id, idx + 1);
        });

        data = sortedData.map((team, idx) => {
          const currentRank = idx + 1;
          const previousRank = previousRankMap.get(team.id);
          // positive = moved up, negative = moved down
          const positionChange = previousRank ? previousRank - currentRank : 0;

          return {
            ...team,
            positionChange,
          };
        });
      } else {
        // Not enough matches to compare, just add positionChange: 0 to sorted data
        data = sortedData.map((team) => ({ ...team, positionChange: 0 }));
      }
    }

    return SuccessResponse({
      data: data,
      message: "Teams fetched successfully",
      meta: getMeta({ currentPage: page, total }),
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await adminMiddleware(req);
    const team = req.nextUrl.searchParams.get("team") || `1`;
    const teamSize = parseInt(team);
    const id = (await params).id;
    const tournamentExist = await getTournamentById({ id });
    const isTeamCreated = await getTeamByTournamentId({ tournamentId: id });
    if (isTeamCreated.length > 0) {
      return ErrorResponse({
        message: "Teams already created for this tournament",
        status: 400,
      });
    }

    if (!tournamentExist) {
      return ErrorResponse({
        message: "tournament does not exist",
        status: 404,
      });
    }

    if (tournamentExist.seasonId === null) {
      return ErrorResponse({
        message: "season does not exist",
        status: 404,
      });
    }

    const teams = await createTeamsByPolls({
      groupSize: teamSize as 1 | 2 | 3 | 4,
      tournamentId: id,
      seasonId: tournamentExist?.seasonId,
      pollId: "",
    });

    return SuccessResponse({
      data: teams,
      message: "Teams created successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await adminMiddleware(req);

    const id = (await params).id;

    const tournamentExist = await getTournamentById({ id });

    const [isTeamCreated, _] = await getTeamByTournamentId({
      tournamentId: id,
    });

    if (isTeamCreated.length === 0) {
      return ErrorResponse({
        message: "Teams not created for this tournament",
        status: 400,
      });
    }

    if (!tournamentExist) {
      return ErrorResponse({
        message: "tournament does not exist",
        status: 404,
      });
    }

    const deletedTeams = await deleteTeamByTournamentId({ tournamentId: id });

    return SuccessResponse({
      data: deletedTeams,
      message: "Teams deleted successfully",
      status: 200,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
