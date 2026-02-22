/**
 * Unified category utilities for player tier calculations.
 * Single source of truth for KD-based category assignment.
 */

export type PlayerTier = 'BOT' | 'ULTRA_NOOB' | 'NOOB' | 'PRO' | 'ULTRA_PRO' | 'LEGEND';

// Standardized KD thresholds (lenient version)
const KD_THRESHOLDS = {
    LEGEND: 1.7,
    ULTRA_PRO: 1.5,
    PRO: 1.0,
    NOOB: 0.5,
    ULTRA_NOOB: 0.2,
} as const;

/**
 * Get player category/tier based on KD ratio.
 * Uses lenient thresholds for fairer distribution.
 */
export function getCategoryFromKD(kills: number, deaths: number): PlayerTier {
    if (deaths === 0) {
        return kills > 0 ? 'LEGEND' : 'BOT';
    }

    const kd = kills / deaths;

    if (kd >= KD_THRESHOLDS.LEGEND) return 'LEGEND';
    if (kd >= KD_THRESHOLDS.ULTRA_PRO) return 'ULTRA_PRO';
    if (kd >= KD_THRESHOLDS.PRO) return 'PRO';
    if (kd >= KD_THRESHOLDS.NOOB) return 'NOOB';
    if (kd >= KD_THRESHOLDS.ULTRA_NOOB) return 'ULTRA_NOOB';
    return 'BOT';
}

/**
 * Get player category/tier from a pre-computed KD value.
 * Use this when you only have the KD number (no kills/deaths).
 */
export function getCategoryFromKDValue(kd: number): PlayerTier {
    if (kd >= KD_THRESHOLDS.LEGEND) return 'LEGEND';
    if (kd >= KD_THRESHOLDS.ULTRA_PRO) return 'ULTRA_PRO';
    if (kd >= KD_THRESHOLDS.PRO) return 'PRO';
    if (kd >= KD_THRESHOLDS.NOOB) return 'NOOB';
    if (kd >= KD_THRESHOLDS.ULTRA_NOOB) return 'ULTRA_NOOB';
    return 'BOT';
}

/**
 * Get human-readable category label.
 */
export function getCategoryLabel(category: PlayerTier): string {
    const labels: Record<PlayerTier, string> = {
        BOT: 'bot',
        ULTRA_NOOB: 'ultra noob',
        NOOB: 'noob',
        PRO: 'pro',
        ULTRA_PRO: 'ultra pro',
        LEGEND: 'legend',
    };
    return labels[category];
}

/**
 * Get category score for team balancing (0-100 scale).
 */
export function getCategoryScore(category: PlayerTier): number {
    const scores: Record<PlayerTier, number> = {
        BOT: 0,
        ULTRA_NOOB: 15,
        NOOB: 35,
        PRO: 55,
        ULTRA_PRO: 75,
        LEGEND: 100,
    };
    return scores[category];
}

/**
 * Legacy function name for backward compatibility.
 * Returns lowercase string for display purposes.
 */
export function getKdRank(kills: number, deaths: number): string {
    return getCategoryLabel(getCategoryFromKD(kills, deaths));
}
