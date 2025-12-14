import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import { createTournament } from "@/src/services/tournament/createTournament";
import { getAllTournament } from "@/src/services/tournament/getAllTournament";
import { cleanupOldRecentMatches } from "@/src/services/recentMatches/cleanupOldRecentMatches";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { tournamentSchema } from "@/src/utils/validation/tournament";

export async function GET(request: Request) {
  try {
    await adminMiddleware(request);
    const tournaments = await getAllTournament();
    return SuccessResponse({ data: tournaments });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await adminMiddleware(req);
    const body = tournamentSchema.parse(await req.json());
    const activeSeason = await getActiveSeason();

    if (!user) {
      return ErrorResponse({ message: "Unauthorized", status: 401 });
    }

    if (!activeSeason) {
      return ErrorResponse({ message: "No active season found", status: 400 });
    }

    const tournament = await createTournament({
      data: {
        ...body,
        createdBy: user.id,
        season: { connect: { id: activeSeason.id } },
      },
    });

    // Cleanup old scoreboard groups (auto-delete after 1 week)
    await cleanupOldRecentMatches();

    return SuccessResponse({ data: tournament, message: "Success" });
  } catch (error) {
    return handleApiErrors(error);
  }
}

