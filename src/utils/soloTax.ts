/**
 * Solo Tax Utility
 * 
 * Calculates tax on solo player winnings and distributes to:
 * - 60% to top 3 loser tiers (players who lost the most in the season)
 * - 40% to next tournament bonus pool
 */

// Tax configuration
const SOLO_TAX_RATE = 0.22; // 22% solo tax
const LOSER_SPLIT = 0.60;   // 60% goes to losers
const POOL_SPLIT = 0.40;    // 40% goes to bonus pool

// Tier distribution for losers
const TIER_PERCENTAGES = [0.50, 0.30, 0.20]; // Tier 1: 50%, Tier 2: 30%, Tier 3: 20%

export interface SoloTaxResult {
    playerId: string;
    originalAmount: number;
    taxAmount: number;
    netAmount: number;
    isSolo: boolean;
}

export interface TaxDistribution {
    totalTax: number;
    loserAmount: number;    // 60%
    poolAmount: number;     // 40%
}

export interface LoserTier {
    tier: number;           // 1, 2, or 3
    lossAmount: number;     // The loss amount for this tier
    playerIds: string[];    // Players in this tier
    distribution: number;   // Amount to distribute to this tier
    perPlayer: number;      // Amount each player in tier gets
}

/**
 * Get the solo tax rate (always 20%)
 */
export function getSoloTaxRate(): number {
    return SOLO_TAX_RATE;
}

/**
 * Calculate solo tax for a player
 */
export function calculateSoloTax(
    playerId: string,
    amount: number,
    isSolo: boolean
): SoloTaxResult {
    if (!isSolo || amount <= 0) {
        return {
            playerId,
            originalAmount: amount,
            taxAmount: 0,
            netAmount: amount,
            isSolo: false,
        };
    }

    const taxAmount = Math.floor(amount * SOLO_TAX_RATE);
    const netAmount = amount - taxAmount;

    return {
        playerId,
        originalAmount: amount,
        taxAmount,
        netAmount,
        isSolo: true,
    };
}

/**
 * Split solo tax into loser support and bonus pool amounts
 */
export function getTaxDistribution(taxAmount: number): TaxDistribution {
    const loserAmount = Math.floor(taxAmount * LOSER_SPLIT);
    const poolAmount = taxAmount - loserAmount; // Remaining goes to pool

    return {
        totalTax: taxAmount,
        loserAmount,
        poolAmount,
    };
}

/**
 * Calculate tier-based distribution for losers
 * 
 * @param loserAmount - Total amount to distribute to losers (60% of tax)
 * @param loserTiers - Array of { lossAmount, playerIds } for top 3 tiers
 * @returns Array of LoserTier with distribution amounts
 */
export function calculateTierDistribution(
    loserAmount: number,
    loserTiers: { lossAmount: number; playerIds: string[] }[]
): LoserTier[] {
    const result: LoserTier[] = [];

    // Only process up to 3 tiers
    const tiersToProcess = loserTiers.slice(0, 3);

    // Adjust percentages if fewer than 3 tiers
    let adjustedPercentages = [...TIER_PERCENTAGES];
    if (tiersToProcess.length === 2) {
        // 60% / 40% for 2 tiers
        adjustedPercentages = [0.60, 0.40];
    } else if (tiersToProcess.length === 1) {
        // 100% for 1 tier
        adjustedPercentages = [1.0];
    }

    let totalDistributed = 0;

    for (let i = 0; i < tiersToProcess.length; i++) {
        const tier = tiersToProcess[i];
        const tierNumber = i + 1;

        // Calculate distribution for this tier
        let distribution: number;
        if (i === tiersToProcess.length - 1) {
            // Last tier gets remaining to avoid rounding issues
            distribution = loserAmount - totalDistributed;
        } else {
            distribution = Math.floor(loserAmount * adjustedPercentages[i]);
        }

        totalDistributed += distribution;

        // Calculate per-player amount
        const perPlayer = tier.playerIds.length > 0
            ? Math.floor(distribution / tier.playerIds.length)
            : 0;

        result.push({
            tier: tierNumber,
            lossAmount: tier.lossAmount,
            playerIds: tier.playerIds,
            distribution,
            perPlayer,
        });
    }

    return result;
}

/**
 * Generate transaction message for loser support
 */
export function getLoserSupportMessage(
    winnerName: string,
    tournamentName: string
): string {
    return `Support from ${winnerName}: ${tournamentName}`;
}

/**
 * Generate transaction message for solo tax debit
 */
export function getSoloTaxDebitMessage(tournamentName: string): string {
    return `Solo Tax: ${tournamentName}`;
}
