/**
 * Prize Distribution Utility
 * 
 * Dynamic prize distribution based on "Money Milestones" - the total prize pool.
 * Tier thresholds determine the number of winners and distribution percentages.
 */

// ============================================================================
// Types
// ============================================================================

export type PrizeTierLevel = 1 | 2 | 3 | 4;

export interface PrizeTierConfig {
    level: PrizeTierLevel;
    minPool: number;
    maxPool: number | null; // null for unlimited
    orgFeePercent: number;
    winnerCount: number;
    /** Percentages for positions 1, 2, 3, etc. */
    percentages: number[];
    description: string;
}

export interface PositionPrize {
    position: number;
    percentage: number | null; // null for fixed amounts
    amount: number;
    isFixed: boolean;
}

export interface PrizeDistributionResult {
    tier: PrizeTierConfig;
    totalPool: number;
    orgFee: number;
    totalWinnerPayout: number;
    prizes: Map<number, PositionPrize>;
    /** Human-readable summary like "Top 3 paid: 50%/25%/15%" */
    summaryText: string;
    /** Short format like "50/25/15" */
    splitText: string;
    /** Refund amount for last place */
    refundAmount: number;
}

// ============================================================================
// Tier Configurations
// ============================================================================

const TIER_CONFIGS: PrizeTierConfig[] = [
    {
        level: 1,
        minPool: 0,
        maxPool: 1199,
        orgFeePercent: 10,
        winnerCount: 2,
        percentages: [60, 30],
        description: "Top 2 paid",
    },
    {
        level: 2,
        minPool: 1200,
        maxPool: 3000,
        orgFeePercent: 10,
        winnerCount: 3,
        // 3rd place gets fixed refund, remaining split between 1st and 2nd
        percentages: [65, 35],
        description: "Top 3 paid",
    },
    {
        level: 3,
        minPool: 3001,
        maxPool: 5000,
        orgFeePercent: 9,
        winnerCount: 4,
        // 4th place gets fixed refund, remaining split among top 3
        percentages: [55, 30, 15],
        description: "Top 4 paid",
    },
    {
        level: 4,
        minPool: 5001,
        maxPool: null,
        orgFeePercent: 8,
        winnerCount: 5,
        // 5th place gets fixed refund, remaining split among top 4
        percentages: [40, 27, 20, 13],
        description: "Top 5 paid",
    },
];

/**
 * Convert TeamType to team size number.
 */
export function getTeamSize(teamType: string): number {
    const sizes: Record<string, number> = {
        SOLO: 1,
        DUO: 2,
        TRIO: 3,
        SQUAD: 4,
    };
    return sizes[teamType] || 2; // Default to duo
}

/**
 * Calculate prize distribution based on total prize pool.
 * 
 * For Tiers 2-4, the last position receives their entry fee × team size as refund.
 * The remaining pool (after org fee and refund) is split by percentages.
 * 
 * @param totalPool - Total prize pool amount
 * @param entryFee - Entry fee per player
 * @param teamSize - Number of players per team (1=solo, 2=duo, 3=trio, 4=squad)
 * @returns Complete prize distribution breakdown
 */
export function getPrizeDistribution(
    totalPool: number,
    entryFee: number = 50,
    teamSize: number = 2
): PrizeDistributionResult {
    // Find the applicable tier
    const tier = TIER_CONFIGS.find(
        (t) => totalPool >= t.minPool && (t.maxPool === null || totalPool <= t.maxPool)
    ) || TIER_CONFIGS[0]; // Fallback to tier 1

    const orgFee = Math.floor(totalPool * (tier.orgFeePercent / 100));
    const prizes = new Map<number, PositionPrize>();

    if (tier.level >= 2) {
        // Tiers 2-4: Last position gets entry fee × team size as refund
        const lastPosition = tier.winnerCount;
        const teamRefund = entryFee * teamSize;
        const refundAmount = Math.min(teamRefund, totalPool - orgFee);
        const remainingForWinners = totalPool - orgFee - refundAmount;

        // Distribute by percentage to all positions except last
        tier.percentages.forEach((percent, idx) => {
            const position = idx + 1;
            const amount = Math.floor(remainingForWinners * (percent / 100));
            prizes.set(position, {
                position,
                percentage: percent,
                amount,
                isFixed: false,
            });
        });

        // Add last place with fixed refund
        prizes.set(lastPosition, {
            position: lastPosition,
            percentage: null,
            amount: Math.floor(refundAmount),
            isFixed: true,
        });
    } else {
        // Tier 1: Standard percentage-based distribution (no refund)
        tier.percentages.forEach((percent, idx) => {
            const position = idx + 1;
            const amount = Math.floor(totalPool * (percent / 100));
            prizes.set(position, {
                position,
                percentage: percent,
                amount,
                isFixed: false,
            });
        });
    }

    // Calculate total winner payout
    let totalWinnerPayout = 0;
    prizes.forEach((prize) => {
        totalWinnerPayout += prize.amount;
    });

    // Generate summary texts
    const teamRefund = entryFee * teamSize;
    const actualRefund = tier.level >= 2 ? Math.min(teamRefund, totalPool - orgFee) : 0;
    const splitText = tier.percentages.join("/");
    const summaryText = tier.level >= 2
        ? `${tier.description}: ${splitText} + ₹${actualRefund} refund`
        : `${tier.description}: ${splitText}`;

    return {
        tier,
        totalPool,
        orgFee,
        totalWinnerPayout,
        prizes,
        summaryText,
        splitText,
        refundAmount: actualRefund,
    };
}

/**
 * Get prize amount for a specific position.
 * Returns 0 if the position doesn't receive a prize in the current tier.
 */
export function getPrizeForPosition(
    totalPool: number,
    position: number,
    fifthPlaceRefund: number = 200
): number {
    const distribution = getPrizeDistribution(totalPool, fifthPlaceRefund);
    return distribution.prizes.get(position)?.amount ?? 0;
}

/**
 * Get all prize positions that will be paid out for a given prize pool.
 */
export function getPaidPositions(totalPool: number): number[] {
    const distribution = getPrizeDistribution(totalPool);
    return Array.from(distribution.prizes.keys()).sort((a, b) => a - b);
}

/**
 * Get tier info without calculating full distribution (lightweight check).
 */
export function getTierInfo(totalPool: number): PrizeTierConfig {
    return TIER_CONFIGS.find(
        (t) => totalPool >= t.minPool && (t.maxPool === null || totalPool <= t.maxPool)
    ) || TIER_CONFIGS[0];
}
