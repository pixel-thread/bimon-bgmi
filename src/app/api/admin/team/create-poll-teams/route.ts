import { getPollById } from "@/src/services/polls/getPollById";
import { createTeamsByPolls } from "@/src/services/team/createTeamsByPoll";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await superAdminMiddleware(req);
    const team = req.nextUrl.searchParams.get("size") || `1`;
    const teamSize = parseInt(team);
    const body = await req.json();
    const id = body.pollId;
    const poll = await getPollById({ where: { id } });
    if (!poll) {
      return ErrorResponse({
        message: "poll does not exist",
        status: 404,
      });
    }
    const tournamentId = poll.tournamentId;
    const tournamentExist = await getTournamentById({ id: tournamentId });

    if (!tournamentExist) {
      return ErrorResponse({
        message: "tournament does not exist",
        status: 404,
      });
    }

    const [existingTeams] = await getTeamByTournamentId({ tournamentId });

    if (existingTeams.length > 0) {
      return ErrorResponse({
        message: "Teams already created for this tournament",
        status: 400,
      });
    }

    // Get the entry fee from the tournament settings
    const entryFee = tournamentExist.fee || 0;

    const result = await createTeamsByPolls({
      groupSize: teamSize as 1 | 2 | 3 | 4,
      tournamentId: poll.tournamentId,
      seasonId: tournamentExist?.seasonId || "",
      pollId: poll.id,
      entryFee,
    });

    // Build response message
    let message = "Teams created successfully";
    if (entryFee > 0) {
      message += `. ${entryFee} UC debited from each player`;
    }
    if (result.playersWithInsufficientBalance.length > 0) {
      const excludedNames = result.playersWithInsufficientBalance
        .map((p) => p.userName)
        .join(", ");
      message += `. Players excluded due to insufficient UC: ${excludedNames}`;
    }

    return SuccessResponse({
      data: {
        teams: result.teams,
        entryFeeCharged: result.entryFeeCharged,
        playersExcluded: result.playersWithInsufficientBalance,
      },
      message,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
