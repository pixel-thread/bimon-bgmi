import { deletePlayer } from "@/src/services/player/deletePlayer";
import { getPlayerById } from "@/src/services/player/getPlayerById";
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
    const player = await getPlayerById({ id });

    // Fetch Clerk user image if clerkId exists
    let clerkImageUrl: string | null = null;
    if (player?.user?.clerkId) {
      try {
        const clerkUser = await clientClerk.users.getUser(player.user.clerkId);
        clerkImageUrl = clerkUser.imageUrl || null;
      } catch (error) {
        console.error("Failed to fetch Clerk user image:", error);
      }
    }

    return SuccessResponse({
      data: {
        ...player,
        clerkImageUrl,
      }
    });
  } catch (error) {
    handleApiErrors(error);
  }
}
