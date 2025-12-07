import { getGalleryImageById } from "@/src/services/gallery/getImageById";
import { addTournamentBackgroundImage } from "@/src/services/tournament/addTournamentBackground";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { removeTournamentBackgroundImage } from "@/src/services/tournament/updateTournamentBackgroundImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function POST(req: Request) {
  try {
    await adminMiddleware(req);

    const { galleryId, tournamentId } = await req.json();

    if (!tournamentId || !galleryId) {
      return ErrorResponse({
        message: "Missing tournamentId or galleryId",
        status: 400,
      });
    }

    // Find the tournament
    const tournament = await getTournamentById({ id: tournamentId });

    if (!tournament) {
      return ErrorResponse({
        message: "Tournament not found",
        status: 404,
      });
    }

    // Check if already linked
    if (tournament.galleryId === galleryId) {
      await removeTournamentBackgroundImage({
        galleryId,
        tournamentId,
      });
    }

    // Check Gallery exists and is not linked elsewhere
    const gallery = await getGalleryImageById({ id: galleryId });

    if (!gallery) {
      return ErrorResponse({
        message: "Gallery image not found",
        status: 404,
      });
    }

    const data = await addTournamentBackgroundImage({
      galleryId,
      tournamentId,
    });

    return SuccessResponse({
      message: "Gallery image linked successfully",
      status: 200,
      data: data.gallery,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
