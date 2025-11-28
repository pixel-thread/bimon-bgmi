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
    const id = (await params).id;
    await tokenMiddleware(req);
    const search = req.nextUrl.searchParams;
    const matchId = search.get("match") || "all";
    let where: Prisma.TeamStatsWhereInput;

    if (matchId === "all") {
      where = { tournamentId: id };
    } else {
      where = {
        tournamentId: id,
        matchId: matchId,
      };
    }

    const tournament = await getTournamentById({ id: id });

    if (!tournament) {
      return ErrorResponse({ message: "Tournament not found" });
    }

    const teams = await getTeamsStats({
      where,
      orderBy: { position: "asc" }, // sort by position
    });

    const data = teams?.map((team) => {
      const teamPlayerStats = team.teamPlayerStats.filter(
        (val) => val.matchId === matchId,
      );
      return {
        name: team.team.players.map((player) => player.user.userName).join("_"),
        position: team.position,
        kills: teamPlayerStats.reduce(
          (total, playerStats) => total + playerStats.kills,
          0,
        ),
        deaths: teamPlayerStats.reduce(
          (total, playerStats) => total + playerStats.deaths,
          0,
        ),
        players: team.team.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
        })),
      };
    });

    return SuccessResponse({
      data: data,
      message: "Teams fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
