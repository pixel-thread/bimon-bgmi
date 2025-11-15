import { createTeamsByPolls } from "@/src/services/team/createTeamsByPoll";
import { deleteTeamByTournamentId } from "@/src/services/team/deleteTeamsByTournamentId";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import {
  calculatePlayerPoints,
  getKdRank,
} from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { logger } from "@/src/utils/logger";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);

    const id = (await params).id;
    const matchId = req.nextUrl.searchParams.get("match") || "";

    const tournament = await getTournamentById({ id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    const teams = await getTeamByTournamentId({
      tournamentId: id,
    });

    const seasonId = tournament.seasonId;
    let data;
    if (matchId !== "all") {
      data = teams?.map((team) => {
        const teamStats = team.teamStats.find((val) => val.matchId === matchId);

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
        const kills = teamStats?.kills || 0;
        const teamPosition = teamStats?.position || 0;
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
          slotNo: team.teamNumber + 1,
          kills: teamStats?.kills || 0,
          deaths: teamStats?.deaths || 0,
          position: teamPosition,
          pts: pts,
          total: total,
          players: teamPlayers,
        };
      });
    } else {
      data = teams?.map((team) => {
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

        const teamStats = team.teamStats.filter(
          (val) => val.seasonId === seasonId && val.teamId === team.id,
        );

        const groupStats = teamStats.map((stat) => {
          const kills = stat.kills || 0;
          const pts = calculatePlayerPoints(stat.position, 0); // Calculate points based on position
          const total = kills + pts;
          return {
            ...stat, // Keep all original fields
            kills,
            pts, // Add calculated points
            total, // Add total score
          };
        });

        const kills = groupStats.reduce((acc, val) => acc + val.kills, 0);
        const pts = groupStats.reduce((acc, val) => acc + val.pts, 0);
        const total = pts + kills;
        const teamName = team.players
          .map((player) => player.user.userName)
          .join("_");
        return {
          id: team.id,
          name: teamName,
          matches: team.matches,
          size: team.players.length,
          slotNo: team.teamNumber + 1,
          kills: kills,
          deaths: 0,
          position: 0,
          pts: pts,
          total: total,
          players: teamPlayers,
        };
      });
    }
    const sortedData = data.sort((a, b) => b.total - a.total);
    return SuccessResponse({
      data: sortedData,
      message: "Teams fetched successfully",
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

    const isTeamCreated = await getTeamByTournamentId({ tournamentId: id });

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
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
