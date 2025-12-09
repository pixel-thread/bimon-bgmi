import { createPolls } from "@/src/services/polls/createPolls";
import { getPollByTournamentId } from "@/src/services/polls/getPollByTournamentId";
import { getPolls } from "@/src/services/polls/getPolls";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { pollSchema } from "@/src/utils/validation/poll";
import { clientClerk } from "@/src/lib/clerk/client";

export async function GET(req: Request) {
  try {
    await adminMiddleware(req);

    const polls = await getPolls({
      include: {
        options: true,
        tournament: true,
        playersVotes: {
          include: {
            player: { include: { user: true, characterImage: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }, // newest first
    });

    // Fetch Clerk user images in batch for all voters
    const allClerkIds = new Set<string>();
    polls.forEach((poll: any) => {
      poll.playersVotes?.forEach((vote: any) => {
        if (vote.player?.user?.clerkId) {
          allClerkIds.add(vote.player.user.clerkId);
        }
      });
    });

    const clerkUserMap = new Map<string, string>();
    try {
      if (allClerkIds.size > 0) {
        const clerkUsers = await clientClerk.users.getUserList({
          userId: Array.from(allClerkIds),
          limit: 100,
        });
        clerkUsers.data.forEach((user) => {
          if (user.imageUrl) {
            clerkUserMap.set(user.id, user.imageUrl);
          }
        });
      }
    } catch (error) {
      console.error("Failed to fetch Clerk user images:", error);
    }

    // Add imageUrl to each vote's player
    const pollsWithImages = polls.map((poll: any) => ({
      ...poll,
      playersVotes: poll.playersVotes?.map((vote: any) => ({
        ...vote,
        player: {
          ...vote.player,
          imageUrl: vote.player?.user?.clerkId
            ? clerkUserMap.get(vote.player.user.clerkId) || null
            : null,
        }
      }))
    }));

    return SuccessResponse({
      data: pollsWithImages,
      status: 200,
      message: "Polls fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function POST(req: Request) {
  try {
    await adminMiddleware(req);

    const body = pollSchema.omit({ id: true }).parse(await req.json());

    const isTournamentExist = await getTournamentById({
      id: body.tournamentId,
    });

    if (!isTournamentExist) {
      return ErrorResponse({
        message: "Tournament not found",
        status: 404,
      });
    }
    const isPollExist = await getPollByTournamentId({
      tournamentId: body.tournamentId,
    });

    if (isPollExist) {
      return ErrorResponse({
        message: "Poll already exist for this tournament",
        status: 400,
      });
    }
    const polls = await createPolls({
      data: {
        question: body.question,
        tournament: { connect: { id: body.tournamentId } },
        options: { createMany: { data: body.options } },
        endDate: body.endDate,
        days: body.days,
      },
    });

    return SuccessResponse({
      data: polls,
      status: 200,
      message: "Polls created successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
