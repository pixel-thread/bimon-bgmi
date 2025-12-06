import { prisma } from "@/src/lib/db/prisma";
import { getTournamentById } from "@/src/services/tournament/getTournamentById";
import { calculatePlayerPoints } from "@/src/utils/calculatePlayersPoints";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { sortTeamsByTiebreaker, TeamRankingData } from "@/src/utils/tournamentTiebreaker";
import { NextRequest } from "next/server";

// GET - Fetch team rankings for a tournament with official BGMI tiebreaker rules
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await tokenMiddleware(req);
        const tournamentId = (await params).id;

        const tournament = await getTournamentById({ id: tournamentId });

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found" });
        }

        // Fetch all team stats with match info for determining most recent match
        const teamsStats = await prisma.teamStats.findMany({
            where: { tournamentId },
            include: {
                teamPlayerStats: true,
                match: true, // Include match to get createdAt for most recent match
                team: {
                    include: {
                        matches: true,
                        players: { include: { user: true } }
                    },
                },
            },
        });

        // Group stats by team to calculate aggregated metrics
        const teamStatsMap = new Map<string, {
            teamId: string;
            name: string;
            chickenDinners: number;
            placementPoints: number;
            totalKills: number;
            lastMatchPosition: number;
            lastMatchCreatedAt: Date;
            matches: number;
            players: { id: string; name: string }[];
        }>();

        // Process each team stats entry
        for (const stat of teamsStats) {
            const teamId = stat.teamId;
            const existing = teamStatsMap.get(teamId);

            const matchKills = stat.teamPlayerStats.reduce((acc, val) => acc + val.kills, 0);
            const placementPts = calculatePlayerPoints(stat.position, 0); // Get only placement points
            const isChickenDinner = stat.position === 1 ? 1 : 0;

            if (existing) {
                // Update existing team stats
                existing.chickenDinners += isChickenDinner;
                existing.placementPoints += placementPts;
                existing.totalKills += matchKills;
                existing.matches += 1;

                // Track most recent match position
                if (stat.match && stat.match.createdAt > existing.lastMatchCreatedAt) {
                    existing.lastMatchPosition = stat.position;
                    existing.lastMatchCreatedAt = stat.match.createdAt;
                }
            } else {
                // Create new entry for team
                teamStatsMap.set(teamId, {
                    teamId,
                    name: stat.team?.name || "",
                    chickenDinners: isChickenDinner,
                    placementPoints: placementPts,
                    totalKills: matchKills,
                    lastMatchPosition: stat.position,
                    lastMatchCreatedAt: stat.match?.createdAt || new Date(0),
                    matches: 1,
                    players: stat.team?.players.map((player) => ({
                        id: player.id,
                        name: player.user.userName,
                    })) || [],
                });
            }
        }

        // Convert to array and calculate total points
        const mappedData: TeamRankingData[] = Array.from(teamStatsMap.values()).map((team) => ({
            teamId: team.teamId,
            name: team.name,
            total: team.placementPoints + team.totalKills, // Total = placement pts + kills
            chickenDinners: team.chickenDinners,
            placementPoints: team.placementPoints,
            totalKills: team.totalKills,
            lastMatchPosition: team.lastMatchPosition,
            matches: team.matches,
            players: team.players,
        }));

        // Sort using official BGMI tiebreaker rules
        const sortedData = sortTeamsByTiebreaker(mappedData);

        return SuccessResponse({
            message: "Team rankings fetched successfully",
            data: sortedData,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
