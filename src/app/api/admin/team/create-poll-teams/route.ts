import { getPollById } from "@/src/services/polls/getPollById";
import { createTeamsByPolls } from "@/src/services/team/createTeamsByPoll";
import { getTeamByTournamentId } from "@/src/services/team/getTeamByTournamentId";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { createJob } from "@/src/services/job/createJob";
import { updateJobProgress } from "@/src/services/job/updateJobProgress";
import { JobType, JobStatus } from "@/src/lib/db/prisma/generated/prisma";
import { waitUntil } from "@vercel/functions";

export async function POST(req: NextRequest) {
  try {
    const user = await adminMiddleware(req);
    const team = req.nextUrl.searchParams.get("size") || `1`;
    const teamSize = parseInt(team);
    const body = await req.json();
    const id = body.pollId;
    const previewTeams = body.previewTeams; // Optional: array of { teamNumber, playerIds }

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

    // Create a job record to track this operation
    const job = await createJob({
      type: JobType.CREATE_TEAMS_BY_POLL,
      pollId: poll.id,
      createdBy: user.id,
    });

    // Get the entry fee from the tournament settings
    const entryFee = tournamentExist.fee || 0;

    // Define the background task
    const backgroundTask = async () => {
      try {
        // Update job status to PROCESSING
        await updateJobProgress({
          jobId: job.id,
          status: JobStatus.PROCESSING,
          progress: "Creating match and teams...",
        });

        // Progress update - deducting UC if applicable
        if (entryFee > 0) {
          await updateJobProgress({
            jobId: job.id,
            progress: "Creating teams and deducting entry fees...",
          });
        }

        const result = await createTeamsByPolls({
          groupSize: teamSize as 1 | 2 | 3 | 4,
          tournamentId: poll.tournamentId,
          seasonId: tournamentExist?.seasonId || "",
          pollId: poll.id,
          entryFee,
          previewTeams, // Pass preview teams if provided
        });

        // Update job as completed with result data
        await updateJobProgress({
          jobId: job.id,
          status: JobStatus.COMPLETED,
          progress: "Complete",
          result: {
            teamsCreated: result.teams.length,
            entryFeeCharged: result.entryFeeCharged,
            playersExcluded: result.playersWithInsufficientBalance.length,
          },
        });
      } catch (error) {
        // Update job as failed with error message
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        await updateJobProgress({
          jobId: job.id,
          status: JobStatus.FAILED,
          progress: "Failed",
          error: errorMessage,
        });
      }
    };

    // Use waitUntil to keep the serverless function alive while the background task runs
    // This is the Vercel-recommended way to run background tasks
    waitUntil(backgroundTask());

    // Return job ID immediately so client can start polling
    return SuccessResponse({
      data: { jobId: job.id },
      message: "Team creation started. Use job ID to check status.",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
