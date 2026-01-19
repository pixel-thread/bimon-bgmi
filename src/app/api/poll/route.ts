import { getPolls } from "@/src/services/polls/getPolls";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { clientClerk } from "@/src/lib/clerk/client";

export async function GET(req: NextRequest) {
  try {
    await tokenMiddleware(req);
    const query = req.nextUrl.searchParams;
    const page = query.get("page");
    const withImages = query.get("withImages") === "true";

    const polls = await getPolls({
      where: { isActive: true },
      include: {
        options: true,
        tournament: true,
        playersVotes: {
          include: {
            player: {
              include: {
                user: true,
                characterImage: true,
                royalPasses: { take: 1 },
              }
            }
          },
        },
      },
      page,
    });

    // Only fetch Clerk images if requested (for lazy loading)
    if (withImages) {
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

      // Add imageUrl and hasRoyalPass to each vote's player
      const pollsWithImages = polls.map((poll: any) => ({
        ...poll,
        playersVotes: poll.playersVotes?.map((vote: any) => ({
          ...vote,
          player: {
            ...vote.player,
            imageUrl: vote.player?.user?.clerkId
              ? clerkUserMap.get(vote.player.user.clerkId) || null
              : null,
            hasRoyalPass: vote.player?.royalPasses?.length > 0,
          }
        }))
      }));

      return SuccessResponse({
        data: pollsWithImages,
        status: 200,
        message: "Polls fetched successfully",
      });
    }

    // Add hasRoyalPass to players even without images
    const pollsWithRoyalPass = polls.map((poll: any) => ({
      ...poll,
      playersVotes: poll.playersVotes?.map((vote: any) => ({
        ...vote,
        player: {
          ...vote.player,
          hasRoyalPass: vote.player?.royalPasses?.length > 0,
        }
      }))
    }));

    return SuccessResponse({
      data: pollsWithRoyalPass,
      status: 200,
      message: "Polls fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}



