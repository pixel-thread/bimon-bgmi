import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { getTeamsStats } from "@/src/services/team/getTeamsStats";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { logger } from "@/src/utils/logger";
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

    const teamsStats = await getTeamsStats({ where });

    const data = teamsStats.map((team) => {
      const kills = team.teamPlayerStats.reduce(
        (total, teamPlayer) => total + teamPlayer.kills,
        0,
      );
      const position = team.position;
      const pts = calculatePlayerPoints(position, kills);
      const total = kills + pts;

      return {
        name: team.team.name,
        matches: team.team.matches.length,
        position: team.position,
        kills: kills,
        deaths: team.teamPlayerStats.reduce(
          (total, teamPlayer) => total + teamPlayer.deaths,
          0,
        ),
        pts: pts,
        total: total,
        players: team.team.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
        })),
      };
    });

    return SuccessResponse({
      data: data,
      message: "Out Standing fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
