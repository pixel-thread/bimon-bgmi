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
          .map((player) => player.user.displayName || player.user.userName)
          .join(", "),
        players: winner.team.players.map((player) => ({
          id: player.id,
          name: player.user.userName,
          displayName: player.user.displayName,
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
            place3: null,
            place4: null,
            place5: null,
          };
        }

        const placeKey = `place${winner.position}` as keyof typeof acc[string];
        if (winner.position >= 1 && winner.position <= 5 && acc[winner.tournamentId][placeKey] === null) {
          (acc[winner.tournamentId] as Record<string, unknown>)[placeKey] = winner;
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
          place3: (typeof rawData)[0] | null;
          place4: (typeof rawData)[0] | null;
          place5: (typeof rawData)[0] | null;
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
      { playerName: string; firstPlaceCount: number; secondPlaceCount: number; thirdPlaceCount: number; fourthPlaceCount: number; fifthPlaceCount: number }
    > = {};

    recentTournaments.forEach((tournament) => {
      // Count placements for all 5 positions
      const places = [
        { place: tournament.place1, key: 'firstPlaceCount' as const },
        { place: tournament.place2, key: 'secondPlaceCount' as const },
        { place: tournament.place3, key: 'thirdPlaceCount' as const },
        { place: tournament.place4, key: 'fourthPlaceCount' as const },
        { place: tournament.place5, key: 'fifthPlaceCount' as const },
      ];

      places.forEach(({ place, key }) => {
        if (place?.players) {
          place.players.forEach((player) => {
            if (!playerPlacementMap[player.id]) {
              playerPlacementMap[player.id] = {
                playerName: player.name,
                firstPlaceCount: 0,
                secondPlaceCount: 0,
                thirdPlaceCount: 0,
                fourthPlaceCount: 0,
                fifthPlaceCount: 0,
              };
            }
            playerPlacementMap[player.id][key] += 1;
          });
        }
      });
    });

    // Convert to array and sort by total placements
    const playerPlacements = Object.values(playerPlacementMap)
      .map((p) => ({
        ...p,
        totalPlacements: p.firstPlaceCount + p.secondPlaceCount + p.thirdPlaceCount + p.fourthPlaceCount + p.fifthPlaceCount,
      }))
      .sort((a, b) => b.totalPlacements - a.totalPlacements);

    // Format recent tournaments for the table
    const recentTournamentResults = recentTournaments.map((t) => ({
      tournamentId: t.tournamentId,
      tournamentName: t.tournamentName,
      firstPlace: t.place1?.players?.map((p) => p.name) || [],
      secondPlace: t.place2?.players?.map((p) => p.name) || [],
      thirdPlace: t.place3?.players?.map((p) => p.name) || [],
      fourthPlace: t.place4?.players?.map((p) => p.name) || [],
      fifthPlace: t.place5?.players?.map((p) => p.name) || [],
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
