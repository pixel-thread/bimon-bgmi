import { getPlayerById } from "@/src/services/player/getPlayerById";
import { addPlayerVote } from "@/src/services/polls/addPlayerVote";
import { getPlayerVoteByPollId } from "@/src/services/polls/getPlayerVoteByPollId";
import { getPollById } from "@/src/services/polls/getPollById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { playerVoteSchema } from "@/src/utils/validation/poll";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await tokenMiddleware(req);
    const pollId = (await params).id;
    const playerId = user?.player?.id;

    if (!playerId) {
      return ErrorResponse({
        message: "Player not found",
        status: 404,
      });
    }

    const body = playerVoteSchema.parse(await req.json());

    const isPollExist = await getPollById({
      where: { id: pollId },
      include: { options: true },
    });

    if (!isPollExist) {
      return ErrorResponse({
        message: "Poll not found",
        status: 404,
      });
    }

    const isPlayerExist = await getPlayerById({ id: playerId });

    if (!isPlayerExist) {
      return ErrorResponse({
        message: "Player not found",
        status: 404,
      });
    }

    if (isPlayerExist.isBanned) {
      return ErrorResponse({
        message: "Banned player cannot vote",
        status: 400,
      });
    }

    const isPlayerVoted = await getPlayerVoteByPollId({
      playerId,
      pollId,
    });

    if (isPlayerVoted) {
      return ErrorResponse({
        message: "Player already voted",
        status: 400,
      });
    }

    const vote = await addPlayerVote({
      data: {
        playerId: playerId,
        poll: { connect: { id: pollId } },
        vote: body.vote,
      },
    });

    return SuccessResponse({
      message: "Vote added successfully",
      data: vote,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
