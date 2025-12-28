/**
 * Repeat Winner Tax Utility
 * 
 * Calculates tax on frequent winners based on their win count in recent tournaments.
 * Tax is split 60% to Fund, 40% to Org.
 */

// Tax tiers based on win count in last 6 season tournaments
const TAX_TIERS = [
    { minWins: 4, rate: 0.30 }, // 30% for 4+ wins
    { minWins: 3, rate: 0.20 }, // 20% for 3 wins
    { minWins: 2, rate: 0.10 }, // 10% for 2 wins
] as const;

// Tax distribution split
const FUND_SPLIT = 0.60; // 60% of tax goes to fund
const ORG_SPLIT = 0.40;  // 40% of tax goes to org

export interface TaxResult {
    playerId: string;
    originalAmount: number;
    taxAmount: number;
    netAmount: number;
    taxRate: number;
    winCount: number;
}

export interface TaxTotals {
    totalTax: number;
    fundContribution: number;  // 60% of tax
    orgContribution: number;   // 40% of tax
}

/**
 * Get the tax rate for a player based on their win count.
 */
export function getTaxRate(winCount: number): number {
    for (const tier of TAX_TIERS) {
        if (winCount >= tier.minWins) {
            return tier.rate;
        }
    }
    return 0; // No tax for 0-1 wins
}

/**
 * Calculate the repeat winner tax for a single player.
 */
export function calculateRepeatWinnerTax(
    playerId: string,
    amount: number,
    winCount: number
): TaxResult {
    const taxRate = getTaxRate(winCount);
    const taxAmount = Math.floor(amount * taxRate);
    const netAmount = amount - taxAmount;

    return {
        playerId,
        originalAmount: amount,
        taxAmount,
        netAmount,
        taxRate,
        winCount,
    };
}

/**
 * Aggregate tax totals from multiple tax results.
 * Splits total tax 60/40 between Fund and Org.
 */
export function aggregateTaxTotals(taxResults: TaxResult[]): TaxTotals {
    const totalTax = taxResults.reduce((sum, r) => sum + r.taxAmount, 0);

    return {
        totalTax,
        fundContribution: Math.floor(totalTax * FUND_SPLIT),
        orgContribution: Math.ceil(totalTax * ORG_SPLIT), // Ceil to avoid losing a rupee
    };
}

/**
 * Get a human-readable description of the tax applied.
 */
export function getTaxDescription(taxResult: TaxResult): string {
    if (taxResult.taxRate === 0) {
        return "";
    }
    return `Repeat Winner Tax (${Math.round(taxResult.taxRate * 100)}% on ${taxResult.winCount} wins): -₹${taxResult.taxAmount}`;
}
