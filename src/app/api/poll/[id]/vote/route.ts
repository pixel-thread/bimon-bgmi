import { getPlayerById } from "@/src/services/player/getPlayerById";
import { addPlayerVote } from "@/src/services/polls/addPlayerVote";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { prisma } from "@/src/lib/db/prisma";
import { deletePlayerVote } from "@/src/services/polls/deletePlayerVote";
import { getPlayerVoteByPollId } from "@/src/services/polls/getPlayerVoteByPollId";
import { getPollById } from "@/src/services/polls/getPollById";
import { getPollVoter } from "@/src/services/polls/getPollVoter";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { playerVoteSchema } from "@/src/utils/validation/poll";
import { isMeritBanEnabled, getAppSetting } from "@/src/services/settings/getAppSetting";
import { selectLuckyVoter } from "@/src/services/team/previewTeamsByPoll";

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

    // Block voting for non-onboarded users
    if (!user.isOnboarded) {
      return ErrorResponse({
        message: "Please complete onboarding first to vote",
        status: 403,
      });
    }

    const body = playerVoteSchema.parse(await req.json());

    const isPollExist = await getPollById({
      where: { id: pollId },
      include: { options: true, tournament: true },
    }) as Prisma.PollGetPayload<{ include: { options: true; tournament: true } }> | null;

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

    if (user.role === "USER" && body.vote !== "OUT") {
      const tournamentFee = isPollExist.tournament?.fee || 0;
      const userBalance = (user as any).player?.uc?.balance ?? 0;

      // Calculate committed UC from other active polls
      const activePollsVoted = await prisma.playerPollVote.findMany({
        where: {
          playerId: playerId,
          poll: {
            isActive: true,
            id: { not: pollId }, // Exclude current poll
            tournament: {
              fee: { gt: 0 }, // Only count tournaments with fee
            },
          },
        },
        include: {
          poll: {
            include: {
              tournament: true,
            },
          },
        },
      });

      const committedUC = activePollsVoted.reduce((acc, vote) => {
        return acc + (vote.poll.tournament?.fee || 0);
      }, 0);

      const potentialBalance = userBalance - committedUC;

      if (potentialBalance < tournamentFee) {
        return ErrorResponse({
          message: `dap rat bai rung (${userBalance} UC)`,
          status: 403,
        });
      }
    }

    if (user.role === "PLAYER" && body.vote !== "OUT") {
      const userBalance = (user as any).player?.uc?.balance ?? 0;
      const isTrusted = (user as any).player?.isTrusted ?? false;
      const minBalance = isTrusted ? -100 : -30;
      if (userBalance < minBalance) {
        return ErrorResponse({
          message: `sen chuwa bai rung (${userBalance} UC)`,
          status: 403,
        });
      }
    }

    // Solo-restricted players (low merit) can only vote OUT or SOLO
    // But only if merit ban system is enabled
    if (body.vote === "IN") {
      const meritBanEnabled = await isMeritBanEnabled();
      const isSoloRestricted = isPlayerExist.isSoloRestricted === true;
      const soloMatchesNeeded = isPlayerExist.soloMatchesNeeded ?? 0;
      if (meritBanEnabled && isSoloRestricted) {
        return ErrorResponse({
          message: `Low merit! Play ${soloMatchesNeeded} solo match${soloMatchesNeeded > 1 ? "es" : ""} to team up again`,
          status: 403,
        });
      }
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

    // Lucky voter selection - only for IN or SOLO votes on polls with entry fees
    let isLuckyVoter = false;
    const tournamentFee = isPollExist.tournament?.fee || 0;
    const seasonId = isPollExist.tournament?.seasonId;

    if ((body.vote === "IN" || body.vote === "SOLO") && tournamentFee > 0 && seasonId) {
      // Check if this poll already has a lucky voter
      const pollWithLucky = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { luckyVoterId: true },
      });

      if (!pollWithLucky?.luckyVoterId) {
        // No lucky voter yet - get all eligible voters (IN or SOLO) and select one
        const eligibleVotes = await prisma.playerPollVote.findMany({
          where: {
            pollId,
            vote: { in: ["IN", "SOLO"] },
          },
          select: { playerId: true },
        });

        const eligiblePlayerIds = eligibleVotes.map(v => v.playerId);

        // Select lucky voter using once-per-season algorithm
        const luckyVoterId = await selectLuckyVoter(eligiblePlayerIds, pollId, seasonId);

        if (luckyVoterId) {
          // Store lucky voter in poll
          await prisma.poll.update({
            where: { id: pollId },
            data: { luckyVoterId },
          });

          // Check if current player is the lucky voter
          isLuckyVoter = luckyVoterId === playerId;
        }
      } else {
        // Check if current player is the existing lucky voter
        isLuckyVoter = pollWithLucky.luckyVoterId === playerId;
      }
    }

    return SuccessResponse({
      message: isLuckyVoter ? "🎉 Congratulations! You won FREE ENTRY!" : "Vote added successfully",
      data: { ...vote, isLuckyVoter },
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
