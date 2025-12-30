/**
 * Prize Distribution Utility
 * 
 * Dynamic prize distribution based on "Money Milestones" - the total prize pool.
 * Tier thresholds determine the number of winners and distribution percentages.
 * 
 * Rules:
 * 1. Org = 10%, Fund = 4% (fixed across all tiers)
 * 2. UC-exempt players count in prize pool, but their entry fee is subtracted from Org
 * 3. Org minimum = ₹20
 * 4. Org should always be > Fund (take from Fund if needed)
 * 5. Odd prize amounts cascade up (lower positions → higher, finally 1st → Fund)
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
    fundPercent: number; // 5% fund for community/future events
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
    fundAmount: number; // 5% fund amount
    totalWinnerPayout: number;
    prizes: Map<number, PositionPrize>;
    /** Human-readable summary like "Top 3 paid: 50%/25%/15%" */
    summaryText: string;
    /** Short format like "50/25/15" */
    splitText: string;
    /** Refund amount for last place */
    refundAmount: number;
}

export interface FinalDistributionResult extends PrizeDistributionResult {
    /** Adjusted org amount after UC-exempt costs and adjustments */
    finalOrgAmount: number;
    /** Adjusted fund amount after adjustments */
    finalFundAmount: number;
    /** UC-exempt cost that org is covering */
    ucExemptCost: number;
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
        fundPercent: 4,
        winnerCount: 2,
        percentages: [57, 29], // ~86% to winners (remaining after 10% org + 4% fund)
        description: "Top 2 paid",
    },
    {
        level: 2,
        minPool: 1200,
        maxPool: 3000,
        orgFeePercent: 10,
        fundPercent: 4,
        winnerCount: 3,
        // 3rd place gets fixed refund, remaining split between 1st and 2nd
        percentages: [62, 33], // ~95% of winner pool
        description: "Top 3 paid",
    },
    {
        level: 3,
        minPool: 3001,
        maxPool: 5000,
        orgFeePercent: 10,
        fundPercent: 4,
        winnerCount: 4,
        // 4th place gets fixed refund, remaining split among top 3
        percentages: [52, 28, 14], // ~94% of winner pool
        description: "Top 4 paid",
    },
    {
        level: 4,
        minPool: 5001,
        maxPool: null,
        orgFeePercent: 10,
        fundPercent: 4,
        winnerCount: 5,
        // 5th place gets fixed refund, remaining split among top 4
        percentages: [38, 26, 19, 12], // ~95% of winner pool
        description: "Top 5 paid",
    },
];

// Constants
const ORG_MINIMUM = 20;

/**
 * Convert TeamType to team size number.
 */
export function getTeamSize(teamType: string): number {
    const sizes: Record<string, number> = {
        SOLO: 1,
        DUO: 2,
        TRIO: 3,
        SQUAD: 4,
        DYNAMIC: 2, // Default fallback; actual size determined at team creation
    };
    return sizes[teamType] || 2; // Default to duo
}

/**
 * Make a number even by rounding down.
 * Returns the amount to add to the next higher position.
 */
function makeEven(amount: number): { evenAmount: number; remainder: number } {
    const remainder = amount % 2;
    return {
        evenAmount: amount - remainder,
        remainder,
    };
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
    let fundAmount = Math.floor(totalPool * (tier.fundPercent / 100));
    const prizes = new Map<number, PositionPrize>();

    if (tier.level >= 2) {
        // Tiers 2-4: Last position gets entry fee × team size as refund
        const lastPosition = tier.winnerCount;
        const teamRefund = entryFee * teamSize;
        const refundAmount = Math.min(teamRefund, totalPool - orgFee - fundAmount);
        const remainingForWinners = totalPool - orgFee - fundAmount - refundAmount;

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

    // Cascade odd amounts: lower positions → higher, finally 1st → Fund
    // Process from highest position to lowest
    const positions = Array.from(prizes.keys()).sort((a, b) => b - a);
    let carryOver = 0;

    for (const position of positions) {
        const prize = prizes.get(position)!;
        const adjustedAmount = prize.amount + carryOver;
        const { evenAmount, remainder } = makeEven(adjustedAmount);

        prizes.set(position, {
            ...prize,
            amount: evenAmount,
        });

        carryOver = remainder;
    }

    // Any remaining amount from rounding goes to org
    let adjustedOrgFee = orgFee + carryOver;

    // Calculate total winner payout
    let totalWinnerPayout = 0;
    prizes.forEach((prize) => {
        totalWinnerPayout += prize.amount;
    });

    // Ensure total adds up exactly - any remainder from floor() goes to org
    const totalDistributed = adjustedOrgFee + fundAmount + totalWinnerPayout;
    const remainder = totalPool - totalDistributed;
    adjustedOrgFee += remainder;

    // Generate summary texts
    const teamRefund = entryFee * teamSize;
    const actualRefund = tier.level >= 2 ? Math.min(teamRefund, totalPool - orgFee - fundAmount) : 0;
    const splitText = tier.percentages.join("/");
    const summaryText = tier.level >= 2
        ? `${tier.description}: ${splitText} + ₹${actualRefund} refund`
        : `${tier.description}: ${splitText}`;

    return {
        tier,
        totalPool,
        orgFee: adjustedOrgFee,
        fundAmount,
        totalWinnerPayout,
        prizes,
        summaryText,
        splitText,
        refundAmount: actualRefund,
    };
}

/**
 * Calculate final distribution with UC-exempt adjustments.
 * 
 * Rules:
 * 1. UC-exempt players count in prize pool but their entry fee is subtracted from Org
 * 2. Org minimum = ₹20
 * 3. Org should always be > Fund (take from Fund if needed)
 * 
 * @param totalPool - Total prize pool amount (includes UC-exempt as if they paid)
 * @param entryFee - Entry fee per player
 * @param teamSize - Number of players per team
 * @param ucExemptCount - Number of UC-exempt players
 * @returns Final distribution with adjusted org and fund amounts
 */
export function getFinalDistribution(
    totalPool: number,
    entryFee: number,
    teamSize: number,
    ucExemptCount: number
): FinalDistributionResult {
    const base = getPrizeDistribution(totalPool, entryFee, teamSize);

    // Calculate UC-exempt cost (entry fee for each exempt player)
    const ucExemptCost = ucExemptCount * entryFee;

    // Calculate raw org amount after UC-exempt cost
    let rawOrgAmount = base.orgFee - ucExemptCost;
    let adjustedFund = base.fundAmount;

    // Rule 1: Org minimum = ₹20
    if (rawOrgAmount < ORG_MINIMUM) {
        const neededFromFund = ORG_MINIMUM - rawOrgAmount;
        const takeFromFund = Math.min(neededFromFund, adjustedFund);
        adjustedFund -= takeFromFund;
        rawOrgAmount += takeFromFund;
    }

    // Rule 2: Org should always be > Fund
    if (rawOrgAmount <= adjustedFund && adjustedFund > 0) {
        // We need org > fund, so we need to take from fund
        // Target: org = fund + 1 (minimum to be greater)
        // But we also need to respect org minimum

        // Calculate how much we have total
        const combined = rawOrgAmount + adjustedFund;

        // Split so that org > fund
        // If combined is X, we want org = ceil(X/2) + 1 and fund = floor(X/2) - 1 (roughly)
        // Actually simpler: take from fund until org > fund, but ensure org >= ORG_MINIMUM

        const targetOrg = Math.max(ORG_MINIMUM, Math.floor(combined / 2) + 1);
        const targetFund = combined - targetOrg;

        if (targetFund >= 0) {
            rawOrgAmount = targetOrg;
            adjustedFund = targetFund;
        } else {
            // Not enough combined, give all to org
            rawOrgAmount = combined;
            adjustedFund = 0;
        }
    }

    // Ensure org is at least ORG_MINIMUM (final check)
    const finalOrgAmount = Math.max(rawOrgAmount, Math.min(ORG_MINIMUM, base.orgFee + base.fundAmount));
    const finalFundAmount = Math.max(0, adjustedFund);

    return {
        ...base,
        finalOrgAmount,
        finalFundAmount,
        ucExemptCost,
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
