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
      const minBalance = isTrusted ? -100 : -29;
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

    // Check max player capacity and max team count
    // Max 64 players AND mode-specific team limits
    if (body.vote !== "OUT") {
      const teamType = isPollExist.teamType;
      const MAX_PLAYERS = 64;

      // Max teams per mode
      const maxTeamsMap: Record<string, number> = {
        SOLO: 64,
        DUO: 49,
        TRIO: 24,
        SQUAD: 24,
        DYNAMIC: 49, // Default to duo limit
      };
      const MAX_TEAMS = maxTeamsMap[teamType || "DYNAMIC"] || 49;

      // Get team size based on poll's teamType
      const teamSizeMap: Record<string, number> = {
        SOLO: 1,
        DUO: 2,
        TRIO: 3,
        SQUAD: 4,
        DYNAMIC: 2, // Default to duo for dynamic
      };
      const teamSize = teamSizeMap[teamType || "DYNAMIC"] || 2;

      // Count current voters (excluding current player's previous vote)
      const currentVotes = await prisma.playerPollVote.findMany({
        where: {
          pollId,
          vote: { in: ["IN", "SOLO"] },
          playerId: { not: playerId },
        },
        select: { vote: true },
      });

      const currentInVoters = currentVotes.filter(v => v.vote === "IN").length;
      const currentSoloVoters = currentVotes.filter(v => v.vote === "SOLO").length;
      const totalVoters = currentInVoters + currentSoloVoters;

      // Check max players limit
      if (totalVoters >= MAX_PLAYERS) {
        return ErrorResponse({
          message: `Slot full! Max ${MAX_PLAYERS} players`,
          status: 403,
        });
      }

      // Calculate projected teams if this vote is added
      let projectedInVoters = currentInVoters;
      let projectedSoloVoters = currentSoloVoters;

      if (body.vote === "IN") {
        projectedInVoters += 1;
      } else if (body.vote === "SOLO") {
        projectedSoloVoters += 1;
      }

      // Total teams = full teams from IN voters + solo teams
      const fullTeamsFromIn = Math.floor(projectedInVoters / teamSize);
      const projectedTeams = fullTeamsFromIn + projectedSoloVoters;

      // Check max teams limit (mode-specific)
      if (projectedTeams > MAX_TEAMS) {
        return ErrorResponse({
          message: `Team limit reached! Max ${MAX_TEAMS} teams for ${teamType || "this"} mode`,
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

    // Lucky voter selection - Fair dice roll: each voter gets equal 8% chance
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
        // No lucky voter yet - check if this player is eligible for the dice roll
        // First, check if they already won this season (excluded from lottery)
        const luckyVotersJson = await getAppSetting("luckyVotersBySeason");
        const luckyVotersBySeason: Record<string, string[]> = luckyVotersJson
          ? JSON.parse(luckyVotersJson)
          : {};
        const seasonLuckyVoters = luckyVotersBySeason[seasonId] || [];

        // Only roll the dice if player hasn't won this season
        if (!seasonLuckyVoters.includes(playerId)) {
          // Fair dice roll: 8% chance per voter (everyone has equal odds)
          const LUCKY_CHANCE_PERCENT = 8;
          const roll = Math.floor(Math.random() * 100);

          if (roll < LUCKY_CHANCE_PERCENT) {
            // Winner! Store in poll
            await prisma.poll.update({
              where: { id: pollId },
              data: { luckyVoterId: playerId },
            });
            isLuckyVoter = true;
          }
        }
        // If no one wins during voting, fallback selection happens at team creation
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
