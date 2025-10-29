import { getAllPlayers } from "@/src/services/player/getAllPlayers";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(req: Request) {
  try {
    await tokenMiddleware(req);

    const players = await getAllPlayers({
      where: { isBanned: false },
      include: { user: true, playerStats: true },
    });

    if (!players || players.length === 0) {
      return ErrorResponse({
        message: "No players found",
        status: 404,
      });
    }

    // Only include players with valid stats
    const playersWithKD = players
      .map((p) => {
        const kd =
          p.playerStats?.kd ??
          (p.playerStats?.deaths && p.playerStats.deaths > 0
            ? p.playerStats.kills / p.playerStats.deaths
            : (p.playerStats?.kills ?? 0));
        return {
          ...p,
          computedKD: kd,
          kills: p.playerStats?.kills ?? 0,
          wins: p.playerStats?.wins ?? 0,
        };
      })
      .filter((p) => p.computedKD !== undefined && p.computedKD !== null);

    // Improve tie-breaking: KD, kills, then wins
    const sortedPlayers = playersWithKD
      .sort(
        (a, b) =>
          b.computedKD - a.computedKD || b.kills - a.kills || b.wins - a.wins,
      )
      .slice(0, 3);

    // Rearrange so the second highest is first and highest is second (middle)
    if (sortedPlayers.length === 3) {
      const [first, second, third] = sortedPlayers;
      // new order: second, first, third
      sortedPlayers[0] = second;
      sortedPlayers[1] = first;
      sortedPlayers[2] = third;
    } else if (sortedPlayers.length === 2) {
      // If only two players, swap them
      [sortedPlayers[0], sortedPlayers[1]] = [
        sortedPlayers[1],
        sortedPlayers[0],
      ];
    }

    return SuccessResponse({
      data: sortedPlayers,
      message: "Top players fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
