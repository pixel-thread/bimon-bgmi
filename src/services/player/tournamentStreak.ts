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
}> {
    // Get or create tournament sequence
    const currentSeqId = await registerTournamentSequence(tournamentId);

    // Get current active season
    const currentSeasonId = await getActiveSeasonId();

    // Get player's current streak data
    const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
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
        // Same season - check for consecutive tournament
        const expectedSeqId = player.lastTournamentSeqId + 1;

        if (currentSeqId === expectedSeqId) {
            // Consecutive! Increment streak
            newStreak = player.tournamentStreak + 1;
        } else if (currentSeqId === player.lastTournamentSeqId) {
            // Same tournament - don't change streak
            return {
                newStreak: player.tournamentStreak,
                rewardGiven: false,
                rewardAmount: 0,
            };
        }
        // Otherwise, streak breaks - newStreak stays at 1
    }
    // If season changed, newStreak stays at 1 (reset)

    // Check if reward should be given
    let rewardGiven = false;
    let rewardAmount = 0;

    if (newStreak >= STREAK_REWARD_THRESHOLD) {
        rewardGiven = true;
        rewardAmount = STREAK_REWARD_AMOUNT;

        // Award the reward and reset streak
        await prisma.$transaction([
            // Credit UC
            prisma.uC.update({
                where: { playerId },
                data: { balance: { increment: STREAK_REWARD_AMOUNT } },
            }),
            // Create transaction record
            prisma.transaction.create({
                data: {
                    playerId,
                    amount: STREAK_REWARD_AMOUNT,
                    type: "credit",
                    description: `🔥 ${STREAK_REWARD_THRESHOLD}-Tournament Streak Bonus!`,
                },
            }),
            // Reset streak and update last tournament + season
            prisma.player.update({
                where: { id: playerId },
                data: {
                    tournamentStreak: 0, // Reset after reward
                    streakSeasonId: currentSeasonId,
                    lastTournamentSeqId: currentSeqId,
                    lastStreakRewardAt: new Date(),
                },
            }),
        ]);

        return {
            newStreak: 0, // Reset after reward
            rewardGiven: true,
            rewardAmount: STREAK_REWARD_AMOUNT,
        };
    }

    // No reward yet - just update streak
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
    const currentSeqId = await prisma.tournamentSequence.findUnique({
        where: { tournamentId },
        select: { sequenceId: true },
    });

    if (!currentSeqId) {
        return 0;
    }

    // Find all players who:
    // 1. Had a lastTournamentSeqId (participated before)
    // 2. Their lastTournamentSeqId is less than currentSeqId - 1 (missed this tournament)
    // 3. Are NOT in the participant list
    const result = await prisma.player.updateMany({
        where: {
            AND: [
                { lastTournamentSeqId: { not: null } },
                { lastTournamentSeqId: { lt: currentSeqId.sequenceId } },
                { id: { notIn: participantPlayerIds } },
                { tournamentStreak: { gt: 0 } },
            ],
        },
        data: {
            tournamentStreak: 0,
        },
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
}> {
    // Get active season
    const currentSeasonId = await getActiveSeasonId();

    const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: {
            tournamentStreak: true,
            streakSeasonId: true,
            lastStreakRewardAt: true,
        },
    });

    if (!player) {
        return {
            currentStreak: 0,
            progressToReward: 0,
            tournamentsUntilReward: STREAK_REWARD_THRESHOLD,
            lastRewardAt: null,
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
    };
}
