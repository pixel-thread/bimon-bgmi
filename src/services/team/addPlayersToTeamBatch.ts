import { prisma } from "@/src/lib/db/prisma";

type Props = {
    teamId: string;
    matchId: string;
    playerIds: string[];
    seasonId: string;
    tournamentId: string;
};

/**
 * Batch add multiple players to a team in a single transaction.
 * This is optimized for performance compared to adding players one-by-one.
 */
export async function addPlayersToTeamBatch({
    teamId,
    matchId,
    playerIds,
    seasonId,
    tournamentId,
}: Props) {
    return await prisma.$transaction(async (tx) => {
        // 1. Connect all players to the team in one query
        await tx.team.update({
            where: { id: teamId },
            data: {
                players: {
                    connect: playerIds.map((id) => ({ id })),
                },
            },
        });

        // 2. Get the selected match for ordering
        const selectedMatch = await tx.match.findUnique({
            where: { id: matchId },
            select: { createdAt: true },
        });

        if (!selectedMatch) {
            throw new Error("Match not found");
        }

        // 3. Get all matches from selected match onwards
        const allMatches = await tx.match.findMany({
            where: {
                tournamentId: tournamentId || undefined,
                seasonId: seasonId || undefined,
                createdAt: { gte: selectedMatch.createdAt },
            },
            orderBy: { createdAt: "asc" },
            select: { id: true },
        });

        // 4. For each match, create TeamStats if not exists
        for (const match of allMatches) {
            // Find or create TeamStats for this match
            let teamStat = await tx.teamStats.findFirst({
                where: { teamId, matchId: match.id },
                select: { id: true },
            });

            if (!teamStat) {
                teamStat = await tx.teamStats.create({
                    data: {
                        teamId,
                        matchId: match.id,
                        seasonId,
                        tournamentId,
                    },
                    select: { id: true },
                });
            }

            // 5. Connect all players to team stats at once
            await tx.teamStats.update({
                where: { id: teamStat.id },
                data: {
                    players: {
                        connect: playerIds.map((id) => ({ id })),
                    },
                },
            });

            // 6. Batch create TeamPlayerStats for all players in this match
            const existingPlayerStats = await tx.teamPlayerStats.findMany({
                where: {
                    teamId,
                    matchId: match.id,
                    playerId: { in: playerIds },
                },
                select: { playerId: true },
            });

            const existingPlayerIds = new Set(existingPlayerStats.map((s) => s.playerId));
            const newPlayerIds = playerIds.filter((id) => !existingPlayerIds.has(id));

            if (newPlayerIds.length > 0) {
                await tx.teamPlayerStats.createMany({
                    data: newPlayerIds.map((playerId) => ({
                        teamId,
                        matchId: match.id,
                        seasonId,
                        playerId,
                        teamStatsId: teamStat!.id,
                        kills: 0,
                        deaths: 1,
                    })),
                });
            }

            // 7. Batch create MatchPlayerPlayed for all players
            const existingMatchPlayed = await tx.matchPlayerPlayed.findMany({
                where: {
                    matchId: match.id,
                    teamId,
                    playerId: { in: playerIds },
                },
                select: { playerId: true },
            });

            const existingMatchPlayerIds = new Set(existingMatchPlayed.map((m) => m.playerId));
            const newMatchPlayerIds = playerIds.filter((id) => !existingMatchPlayerIds.has(id));

            if (newMatchPlayerIds.length > 0) {
                await tx.matchPlayerPlayed.createMany({
                    data: newMatchPlayerIds.map((playerId) => ({
                        matchId: match.id,
                        playerId,
                        tournamentId,
                        seasonId,
                        teamId,
                    })),
                });
            }
        }

        // 8. Batch upsert PlayerStats for this season
        // NOTE: We do NOT increment deaths here. Deaths (match count) is only updated
        // when scoreboard stats are submitted via bulk edit, not when players are added.
        for (const playerId of playerIds) {
            await tx.playerStats.upsert({
                where: {
                    seasonId_playerId: {
                        playerId,
                        seasonId,
                    },
                },
                create: {
                    playerId,
                    seasonId,
                    kills: 0,
                    deaths: 0, // Start at 0 - will be updated when scoreboard is saved
                },
                update: {}, // No update needed - deaths counted via bulk edit only
            });
        }

        return { success: true };
    });
}
