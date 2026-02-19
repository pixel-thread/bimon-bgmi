/**
 * Tournament Streak Service
 * 
 * Manages player tournament participation streaks and rewards.
 * - Players must participate in consecutive tournaments to build streak
 * - Missing a tournament resets the streak to 0
 * - Every 8 consecutive tournaments = 30 UC bonus
 * - Streak resets when a new season starts
 */

import { prisma } from "@/src/lib/db/prisma";

// Streak reward configuration
export const STREAK_REWARD_THRESHOLD = 8;  // Tournaments needed for reward
export const STREAK_REWARD_AMOUNT = 30;     // UC reward amount

/**
 * Register a tournament in the sequence table.
 * Call this when a tournament is created/finalized to assign it a sequence ID.
 */
export async function registerTournamentSequence(tournamentId: string): Promise<number> {
    const existing = await prisma.tournamentSequence.findUnique({
        where: { tournamentId },
    });

    if (existing) {
        return existing.sequenceId;
    }

    const sequence = await prisma.tournamentSequence.create({
        data: { tournamentId },
    });

    return sequence.sequenceId;
}

/**
 * Get the current active season ID
 */
async function getActiveSeasonId(): Promise<string | null> {
    const activeSeason = await prisma.season.findFirst({
        where: { status: "ACTIVE" },
        select: { id: true },
    });
    return activeSeason?.id ?? null;
}

/**
 * Record a player's tournament participation and update their streak.
 * This should be called when teams are finalized for a tournament.
 * Streak resets if:
 * - Player misses a tournament
 * - A new season has started since their last participation
 * 
 * @param playerId - The player's ID
 * @param tournamentId - The tournament's ID
 * @returns Object containing updated streak info and whether reward was given
 */
export async function recordTournamentParticipation(
    playerId: string,
    tournamentId: string
): Promise<{
    newStreak: number;
    rewardGiven: boolean;
    rewardAmount: number;
    alreadyProcessed: boolean;
}> {
    // Get or create tournament sequence
    const currentSeqId = await registerTournamentSequence(tournamentId);

    // Get current active season
    const currentSeasonId = await getActiveSeasonId();

    // Get player's current streak data (including userId for UC upsert)
    const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
            userId: true,
            tournamentStreak: true,
            streakSeasonId: true,
            lastTournamentSeqId: true,
        },
    });

    if (!player) {
        throw new Error(`Player ${playerId} not found`);
    }

    let newStreak = 1; // Default: starting fresh

    // Check if season changed - if so, reset streak
    const seasonChanged = currentSeasonId && player.streakSeasonId !== currentSeasonId;

    if (!seasonChanged && player.lastTournamentSeqId !== null) {
        // Same season - check if player missed any tournaments

        if (currentSeqId === player.lastTournamentSeqId) {
            // Same tournament - already processed, don't change streak
            return {
                newStreak: player.tournamentStreak,
                rewardGiven: false,
                rewardAmount: 0,
                alreadyProcessed: true,
            };
        }

        // Check if there are any COMPLETED tournaments in the CURRENT SEASON
        // between player's last participation and current tournament
        // This is more accurate than using sequence IDs which are global

        // Get the last tournament's createdAt time
        const lastTournamentSeq = await prisma.tournamentSequence.findUnique({
            where: { sequenceId: player.lastTournamentSeqId },
            select: { tournamentId: true },
        });

        const currentTournamentSeq = await prisma.tournamentSequence.findUnique({
            where: { sequenceId: currentSeqId },
            select: { tournamentId: true },
        });

        if (lastTournamentSeq && currentTournamentSeq) {
            const lastTournament = await prisma.tournament.findUnique({
                where: { id: lastTournamentSeq.tournamentId },
                select: { createdAt: true },
            });

            const currentTournament = await prisma.tournament.findUnique({
                where: { id: currentTournamentSeq.tournamentId },
                select: { createdAt: true },
            });

            if (lastTournament && currentTournament && currentSeasonId) {
                // Count completed tournaments in the same season between these two
                // that the player was NOT a participant in (i.e., actually missed)
                const missedTournaments = await prisma.tournament.count({
                    where: {
                        seasonId: currentSeasonId,
                        isWinnerDeclared: true,
                        createdAt: {
                            gt: lastTournament.createdAt,
                            lt: currentTournament.createdAt,
                        },
                        id: {
                            not: currentTournamentSeq.tournamentId, // Exclude current
                        },
                        // Only count tournaments the player was NOT on any team for
                        NOT: {
                            team: {
                                some: {
                                    players: {
                                        some: { id: playerId },
                                    },
                                },
                            },
                        },
                    },
                });

                if (missedTournaments === 0) {
                    // Player didn't miss any tournaments between - this is consecutive! Increment streak
                    newStreak = player.tournamentStreak + 1;
                }
                // Otherwise, player missed tournaments they should have been in - newStreak stays at 1
            } else {
                // Fallback: if we can't determine, assume consecutive
                newStreak = player.tournamentStreak + 1;
            }
        } else {
            // Fallback: if sequence data missing, assume consecutive
            newStreak = player.tournamentStreak + 1;
        }
    }
    // If season changed, newStreak stays at 1 (reset)

    // Log if streak is being reset unexpectedly (helps detect bugs)
    if (newStreak === 1 && player.tournamentStreak > 1) {
        console.warn(`[Streak] Player ${playerId} streak reset: ${player.tournamentStreak} → 1 (season changed: ${seasonChanged})`);
    }

    // Check if reward should be given (only for RP holders)
    let rewardGiven = false;
    let rewardAmount = 0;

    // Check if player has Royal Pass
    const hasRoyalPass = await prisma.royalPass.findFirst({
        where: { playerId },
    });

    if (newStreak >= STREAK_REWARD_THRESHOLD && hasRoyalPass) {
        // RP holder hitting 8 streak -> set pending reward for them to claim
        // This defers the UC transaction to when the player actively claims it
        rewardGiven = true;
        rewardAmount = STREAK_REWARD_AMOUNT;

        // Set pending reward and reset streak (no UC transfer yet - player must claim)
        await prisma.player.update({
            where: { id: playerId },
            data: {
                tournamentStreak: 0, // Reset after reward
                streakSeasonId: currentSeasonId,
                lastTournamentSeqId: currentSeqId,
                lastStreakRewardAt: new Date(),
                pendingStreakReward: STREAK_REWARD_AMOUNT, // Player must claim this
            },
        });

        return {
            newStreak: 0, // Reset after reward
            rewardGiven: true,
            rewardAmount: STREAK_REWARD_AMOUNT,
            alreadyProcessed: false,
        };
    }

    // No reward (non-RP holder or streak < 8) - just update streak
    // For non-RP holders with streak >= 8: streak keeps going (9, 10, etc.)
    // They lose the 50% RP discount but don't get reset
    await prisma.player.update({
        where: { id: playerId },
        data: {
            tournamentStreak: newStreak,
            streakSeasonId: currentSeasonId,
            lastTournamentSeqId: currentSeqId,
        },
    });

    return {
        newStreak,
        rewardGiven: false,
        rewardAmount: 0,
        alreadyProcessed: false,
    };
}

/**
 * Reset a player's streak (used when they miss a tournament).
 * This is called automatically when checking participation - 
 * you generally don't need to call this manually.
 */
export async function resetStreak(playerId: string): Promise<void> {
    await prisma.player.update({
        where: { id: playerId },
        data: {
            tournamentStreak: 0,
        },
    });
}

/**
 * Batch reset streaks for all players who missed a tournament.
 * Call this after a tournament is finalized.
 * 
 * @param tournamentId - The finalized tournament's ID
 * @param participantPlayerIds - Array of player IDs who participated
 */
export async function resetStreaksForNonParticipants(
    tournamentId: string,
    participantPlayerIds: string[]
): Promise<number> {
    // Get the current tournament's season
    const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { seasonId: true, createdAt: true },
    });

    if (!tournament?.seasonId) {
        return 0;
    }

    // Find all players who:
    // 1. Have an active streak (> 0)
    // 2. Are in the SAME season as this tournament
    // 3. Are NOT in the participant list for this tournament
    // 4. Their last tournament was BEFORE this one (in the same season)

    // Get all players with active streaks in this season who didn't participate
    const playersToReset = await prisma.player.findMany({
        where: {
            AND: [
                { tournamentStreak: { gt: 0 } },
                { streakSeasonId: tournament.seasonId },
                { id: { notIn: participantPlayerIds } },
                { lastTournamentSeqId: { not: null } },
            ],
        },
        select: { id: true, lastTournamentSeqId: true },
    });

    if (playersToReset.length === 0) {
        return 0;
    }

    // For each player, verify they actually missed a tournament in their season
    // by checking if there was a completed tournament in their season between their last and this one
    const playerIdsToReset: string[] = [];

    for (const player of playersToReset) {
        if (!player.lastTournamentSeqId) continue;

        // Get the player's last tournament
        const lastSeq = await prisma.tournamentSequence.findUnique({
            where: { sequenceId: player.lastTournamentSeqId },
            select: { tournamentId: true },
        });

        if (!lastSeq) continue;

        const lastTournament = await prisma.tournament.findUnique({
            where: { id: lastSeq.tournamentId },
            select: { createdAt: true },
        });

        if (!lastTournament) continue;

        // Check if the current tournament is after their last one
        if (tournament.createdAt > lastTournament.createdAt) {
            // This player missed this tournament - reset their streak
            playerIdsToReset.push(player.id);
        }
    }

    if (playerIdsToReset.length === 0) {
        return 0;
    }

    const result = await prisma.player.updateMany({
        where: { id: { in: playerIdsToReset } },
        data: { tournamentStreak: 0 },
    });

    return result.count;
}

/**
 * Get a player's streak info for display
 */
export async function getPlayerStreakInfo(playerId: string): Promise<{
    currentStreak: number;
    progressToReward: number;
    tournamentsUntilReward: number;
    lastRewardAt: Date | null;
    pendingReward: number | null;
}> {
    // Get active season
    const currentSeasonId = await getActiveSeasonId();

    const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
            tournamentStreak: true,
            streakSeasonId: true,
            lastStreakRewardAt: true,
            pendingStreakReward: true,
        },
    });

    if (!player) {
        return {
            currentStreak: 0,
            progressToReward: 0,
            tournamentsUntilReward: STREAK_REWARD_THRESHOLD,
            lastRewardAt: null,
            pendingReward: null,
        };
    }

    // If season changed, show streak as 0
    const effectiveStreak = (currentSeasonId && player.streakSeasonId !== currentSeasonId)
        ? 0
        : player.tournamentStreak;

    const progress = effectiveStreak % STREAK_REWARD_THRESHOLD;

    return {
        currentStreak: effectiveStreak,
        progressToReward: progress,
        tournamentsUntilReward: STREAK_REWARD_THRESHOLD - progress,
        lastRewardAt: player.lastStreakRewardAt,
        pendingReward: player.pendingStreakReward,
    };
}
