import { getPlayerById } from "@/src/services/player/getPlayerById";
import { addPlayerVote } from "@/src/services/polls/addPlayerVote";
import { getPlayerVoteByPollId } from "@/src/services/polls/getPlayerVoteByPollId";
import { getPollById } from "@/src/services/polls/getPollById";
import { getPolls } from "@/src/services/polls/getPolls";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { playerVoteSchema } from "@/src/utils/validation/poll";

export async function GET(req: Request) {
  try {
    await tokenMiddleware(req);
    const polls = await getPolls({
      include: {
        options: true,
      },
    });

    return SuccessResponse({
      data: polls,
      message: "Polls fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function POST(req: Request) {
  try {
    await tokenMiddleware(req);
    const body = playerVoteSchema.parse(await req.json());
    const isPlayerExist = await getPlayerById({ id: body.playerId });
    if (!isPlayerExist) {
      return ErrorResponse({
        message: "Player not found",
        status: 404,
      });
    }
    const isPollExist = await getPollById({ id: body.pollId });
    if (!isPollExist) {
      return ErrorResponse({
        message: "Poll not found",
        status: 404,
      });
    }
    const isPlayerVoted = await getPlayerVoteByPollId({
      playerId: body.playerId,
      pollId: body.pollId,
    });

    if (isPlayerVoted) {
      return ErrorResponse({
        message: "Player already voted for this poll",
        status: 400,
      });
    }

    const playerVote = await addPlayerVote({
      data: {
        player: { connect: { id: body.playerId } },
        poll: { connect: { id: body.pollId } },
        vote: body.vote,
      },
    });

    return SuccessResponse({
      data: playerVote,
      message: "Player vote added successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
