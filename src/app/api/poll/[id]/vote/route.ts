import { getPlayerById } from "@/src/services/player/getPlayerById";
import { addPlayerVote } from "@/src/services/polls/addPlayerVote";
import { deletePlayerVote } from "@/src/services/polls/deletePlayerVote";
import { getPlayerVoteByPollId } from "@/src/services/polls/getPlayerVoteByPollId";
import { getPollById } from "@/src/services/polls/getPollById";
import { getPollVoter } from "@/src/services/polls/getPollVoter";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { playerVoteSchema } from "@/src/utils/validation/poll";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const id = (await params).id;
    const pollVoter = await getPollVoter({
      where: { pollId: id },
      include: { player: { include: { user: true, characterImage: true } } },
    });

    return SuccessResponse({
      data: pollVoter,
      status: 200,
      message: "Poll voter fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

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

    if (!isPollExist.isActive) {
      return ErrorResponse({
        message: "Num lah Vote ka poll la kut leh kham kloi next haw",
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
      await deletePlayerVote({ playerId, pollId });
    }

    const vote = await addPlayerVote({
      data: {
        poll: { connect: { id: pollId } },
        vote: body.vote,
        player: { connect: { id: playerId } },
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
