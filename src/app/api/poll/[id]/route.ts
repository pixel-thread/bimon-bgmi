import { getPollById } from "@/src/services/polls/getPollById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { clientClerk } from "@/src/lib/clerk/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const id = (await params).id;

    const poll = await getPollById({
      where: { id },
      include: {
        options: true,
        playersVotes: {
          include: {
            player: { include: { characterImage: true, user: true } },
          },
        },
      },
    });

    if (!poll) {
      return ErrorResponse({
        message: "Poll not found",
        status: 404,
      });
    }

    // Fetch Clerk user images in batch for all voters
    const allClerkIds = new Set<string>();
    (poll as any).playersVotes?.forEach((vote: any) => {
      if (vote.player?.user?.clerkId) {
        allClerkIds.add(vote.player.user.clerkId);
      }
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
    const pollWithImages = {
      ...poll,
      playersVotes: (poll as any).playersVotes?.map((vote: any) => ({
        ...vote,
        player: {
          ...vote.player,
          imageUrl: vote.player?.user?.clerkId
            ? clerkUserMap.get(vote.player.user.clerkId) || null
            : null,
        }
      }))
    };

    return SuccessResponse({
      data: pollWithImages,
      message: "Poll fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
