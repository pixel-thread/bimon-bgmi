import { createTeamsByPolls } from "@/src/services/team/createTeamsByPoll";
import { deleteTeamByTournamentId } from "@/src/services/team/deleteTeamsByTournamentId";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import {
  calculatePlayerPoints,
  getKdRank,
} from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { getMeta } from "@/src/utils/pagination/getMeta";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);

    const id = (await params).id;

    const matchId = req.nextUrl.searchParams.get("match") || "";

    const page = req.nextUrl.searchParams.get("page") || "1";

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

      const pts = calculatePlayerPoints(teamPosition, 0);

      const total = kills + pts;

      const teamName = team.players
        .map((player) => player.user.userName)
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
        players: teamPlayers,
        teamPlayerStats: teamPlayerStats,
      };
    });

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
    await superAdminMiddleware(req);
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
    await superAdminMiddleware(req);

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
