import { getMatchById } from "@/src/services/match/getMatchById";
import { addPlayerToTeam } from "@/src/services/team/addPlayerToTeam";
import { createTeamByTournamentId } from "@/src/services/team/createTeamByTournamentId";
import { getTeamByTournamentId as getTeamsByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { createTeamSchema } from "@/src/utils/validation/team/create-team-schema";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await superAdminMiddleware(req);
    const body = createTeamSchema.parse(await req.json());

    const isTournamentExist = await getTournamentById({
      id: body.tournamentId,
    });
    if (!isTournamentExist) {
      return ErrorResponse({
        message: "Tournament not found",
        status: 404,
      });
    }
    const teams = await getTeamsByTournamentId({
      tournamentId: body.tournamentId,
    });

    const isMatchExist = await getMatchById({ where: { id: body.matchId } });

    if (!isMatchExist) {
      return ErrorResponse({
        message: "Match not found",
        status: 404,
      });
    }
    const team = await createTeamByTournamentId({
      data: {
        name: Math.random().toString(36).substring(7),
        teamNumber: teams.length + 1,
        tournament: { connect: { id: body.tournamentId } },
        matches: { connect: { id: body.matchId } },
        season: { connect: { id: isTournamentExist?.seasonId || "" } },
      },
    });

    if (body?.players && body?.players?.length > 0) {
      for (const player of body.players) {
        await addPlayerToTeam({
          teamId: team.id,
          matchId: body.matchId,
          playerId: player.playerId,
        });
      }
    }

    return SuccessResponse({
      data: team,
      message: "Team created successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
