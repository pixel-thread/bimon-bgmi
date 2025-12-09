import { getUniqueSeason } from "@/src/services/season/getUniqueSeason";
import { getTournamentWinners } from "@/src/services/winner/getTournamentWinners";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    await tokenMiddleware(req);

    const body = await req.json();

    const isSeasonExist = await getUniqueSeason({
      where: { id: body.seasonId },
    });

    if (!isSeasonExist) {
      return ErrorResponse({ message: "Season not found" });
    }

    const tournamentWinners = await getTournamentWinners({
      where: { team: { seasonId: body.seasonId } },
    });

    // Collect all unique clerkIds from players
    const allClerkIds = new Set<string>();
    tournamentWinners.forEach((winner) => {
      winner.team.players.forEach((player) => {
        if (player.user?.clerkId) {
          allClerkIds.add(player.user.clerkId);
        }
      });
    });

    // Fetch Clerk user images in batch
    const clerkUserMap = new Map<string, string | null>();
    if (allClerkIds.size > 0) {
      try {
        const clientClerk = await clerkClient();
        const clerkUsers = await clientClerk.users.getUserList({
          userId: Array.from(allClerkIds),
          limit: 100,
        });
        clerkUsers.data.forEach((user) => {
          clerkUserMap.set(user.id, user.imageUrl || null);
        });
      } catch (error) {
        console.error("Failed to fetch Clerk users:", error);
      }
    }

    const rawData = tournamentWinners.map((winner) => {
      return {
        id: winner.id,
        tournamentId: winner.tournamentId,
        tournamentName: winner?.tournament?.name || "",
        createdAt: winner.createdAt,
        amount: winner.amount,
        position: winner.position,
        isDistributed: winner.isDistributed,
        teamId: winner.team.id,
        teamName: winner.team.players
          .map((player) => player.user.userName)
          .join(", "),
        players: winner.team.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
          imageUrl: player.user?.clerkId
            ? clerkUserMap.get(player.user.clerkId) || null
            : null,
        })),
      };
    });

    const groupedByTournament = rawData.reduce(
      (acc, winner) => {
        if (!acc[winner.tournamentId]) {
          acc[winner.tournamentId] = {
            tournamentId: winner.tournamentId,
            tournamentName: winner.tournamentName,
            createdAt: winner.createdAt,
            place1: null,
            place2: null,
          };
        }

        if (winner.position === 1 && acc[winner.tournamentId].place1 === null) {
          acc[winner.tournamentId].place1 = winner;
        } else if (
          winner.position === 2 &&
          acc[winner.tournamentId].place2 === null
        ) {
          acc[winner.tournamentId].place2 = winner;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          tournamentId: string;
          tournamentName: string;
          createdAt: Date;
          place1: (typeof rawData)[0] | null;
          place2: (typeof rawData)[0] | null;
        }
      >,
    );

    const allTournaments = Object.values(groupedByTournament);

    // Sort by createdAt descending and get last 6 tournaments
    const sortedTournaments = [...allTournaments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const recentTournaments = sortedTournaments.slice(0, 6);

    // Calculate player placement stats for recent 6 tournaments
    const playerPlacementMap: Record<
      string,
      { playerName: string; firstPlaceCount: number; secondPlaceCount: number }
    > = {};

    recentTournaments.forEach((tournament) => {
      // Count 1st place players
      if (tournament.place1?.players) {
        tournament.place1.players.forEach((player) => {
          if (!playerPlacementMap[player.id]) {
            playerPlacementMap[player.id] = {
              playerName: player.name,
              firstPlaceCount: 0,
              secondPlaceCount: 0,
            };
          }
          playerPlacementMap[player.id].firstPlaceCount += 1;
        });
      }

      // Count 2nd place players
      if (tournament.place2?.players) {
        tournament.place2.players.forEach((player) => {
          if (!playerPlacementMap[player.id]) {
            playerPlacementMap[player.id] = {
              playerName: player.name,
              firstPlaceCount: 0,
              secondPlaceCount: 0,
            };
          }
          playerPlacementMap[player.id].secondPlaceCount += 1;
        });
      }
    });

    // Convert to array and sort by total placements
    const playerPlacements = Object.values(playerPlacementMap)
      .map((p) => ({
        ...p,
        totalPlacements: p.firstPlaceCount + p.secondPlaceCount,
      }))
      .sort((a, b) => b.totalPlacements - a.totalPlacements);

    // Format recent tournaments for the table
    const recentTournamentResults = recentTournaments.map((t) => ({
      tournamentId: t.tournamentId,
      tournamentName: t.tournamentName,
      firstPlace: t.place1?.players?.map((p) => p.name) || [],
      secondPlace: t.place2?.players?.map((p) => p.name) || [],
    }));

    return SuccessResponse({
      message: "Tournament Winners",
      data: {
        tournaments: allTournaments,
        recentStats: {
          playerPlacements,
          recentTournaments: recentTournamentResults,
        },
      },
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
