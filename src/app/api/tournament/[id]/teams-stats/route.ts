import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTeamsStats } from "@/src/services/team/getTeamsStats";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);

    const id = (await params).id;

    const search = req.nextUrl.searchParams;
    const matchId = search.get("match") || "all";
    const tournament = await getTournamentById({ id: id });

    let where: Prisma.TeamStatsWhereInput;

    if (matchId === "all") {
      where = { tournamentId: id };
    } else {
      where = {
        tournamentId: id,
        matchId: matchId,
      };
    }
    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    const teams = await getTeamsStats({
      where,
    });

    return SuccessResponse({
      data: teams,
      message: "Teams fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
