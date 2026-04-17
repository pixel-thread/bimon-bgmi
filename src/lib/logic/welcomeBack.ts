import { prisma } from "@/lib/database";
import { getSettings } from "@/lib/settings";

/**
 * Welcome Back Coupon System
 *
 * Players who return after 2+ completed seasons of inactivity
 * receive a one-time entry fee coupon (auto-applied on next tournament).
 *
 * Detection: No TeamPlayerStats records in the last 2 completed seasons.
 * Grant: Creates a WelcomeBackCoupon with configurable amount.
 * Redemption: Auto-applied during team generation entry fee deduction.
 */

// ─── Detection ──────────────────────────────────────────────

/**
 * Check if a player is returning after 2+ completed seasons of inactivity.
 *
 * "Completed season" = a season with status INACTIVE (ended).
 * We check the last 2 completed seasons and see if the player
 * has zero TeamPlayerStats records in any of them.
 */
export async function isReturningPlayer(
    playerId: string,
    currentSeasonId?: string | null,
): Promise<boolean> {
    // Get last 2 completed (INACTIVE) seasons, ordered by most recent first
    const completedSeasons = await prisma.season.findMany({
        where: { status: "INACTIVE" },
        orderBy: { startDate: "desc" },
        take: 2,
        select: { id: true, startDate: true },
    });

    // Need at least 2 completed seasons to determine inactivity
    if (completedSeasons.length < 2) return false;

    // Player must have been created BEFORE the oldest season we're checking.
    // If they signed up after that season started, they're a new player — not returning.
    const oldestCheckedSeason = completedSeasons[completedSeasons.length - 1];
    const player = await prisma.player.findUnique({
        where: { id: playerId },
        select: { createdAt: true },
    });
    if (!player) return false;

    if (player.createdAt >= oldestCheckedSeason.startDate) return false;

    const seasonIds = completedSeasons.map((s) => s.id);

    // Check if player participated in any of these 2 seasons
    // TeamPlayerStats is the most reliable participation indicator
    const participationCount = await prisma.teamPlayerStats.count({
        where: {
            playerId,
            seasonId: { in: seasonIds },
        },
    });

    // Must have ZERO participation across the last 2 completed seasons
    if (participationCount > 0) return false;

    // But they must have played at least once before (to be a "returning" player)
    // Check if they have ANY historical participation (any season)
    const historicalCount = await prisma.teamPlayerStats.count({
        where: { playerId },
    });

    return historicalCount > 0;
}

// ─── Grant ──────────────────────────────────────────────────

/**
 * Grant a welcome back coupon to a returning player.
 * Only one coupon allowed per active season — prevents farming.
 * Returns the coupon if created, or null if skipped.
 */
export async function grantWelcomeBackCoupon(
    playerId: string,
): Promise<{ id: string; amount: number } | null> {
    // Get the current active season's start date
    const activeSeason = await prisma.season.findFirst({
        where: { status: "ACTIVE" },
        select: { startDate: true },
    });

    // Only one coupon per season — check if player already got one this season
    if (activeSeason) {
        const existing = await prisma.welcomeBackCoupon.findFirst({
            where: {
                playerId,
                createdAt: { gte: activeSeason.startDate },
            },
            select: { id: true },
        });
        if (existing) return null;
    } else {
        // No active season — check for any unused coupon as fallback
        const existing = await prisma.welcomeBackCoupon.findFirst({
            where: { playerId, isUsed: false },
            select: { id: true },
        });
        if (existing) return null;
    }

    // Get configurable amount from settings
    const settings = await getSettings();
    const amount = settings.welcomeBackCouponAmount;

    if (amount <= 0) return null; // Feature disabled if amount is 0

    const coupon = await prisma.welcomeBackCoupon.create({
        data: {
            playerId,
            amount,
        },
        select: { id: true, amount: true },
    });

    return coupon;
}

// ─── Query ──────────────────────────────────────────────────

/**
 * Get the active (unused) welcome back coupon for a player, if any.
 */
export async function getActiveCoupon(
    playerId: string,
): Promise<{ id: string; amount: number } | null> {
    return prisma.welcomeBackCoupon.findFirst({
        where: { playerId, isUsed: false },
        select: { id: true, amount: true },
    });
}

// ─── Redemption ─────────────────────────────────────────────

/**
 * Redeem (consume) a welcome back coupon.
 * Marks it as used with the tournament ID and timestamp.
 */
export async function redeemCoupon(
    couponId: string,
    tournamentId: string,
): Promise<void> {
    await prisma.welcomeBackCoupon.update({
        where: { id: couponId },
        data: {
            isUsed: true,
            usedAt: new Date(),
            usedForTournamentId: tournamentId,
        },
    });
}

// ─── Combined: Check & Grant ────────────────────────────────

/**
 * Check if a player qualifies for a welcome back coupon and grant it.
 * Called after a first-time IN/SOLO vote.
 * Returns the coupon if granted, null otherwise.
 */
export async function checkAndGrantWelcomeBack(
    playerId: string,
    currentSeasonId?: string | null,
): Promise<{ id: string; amount: number } | null> {
    const returning = await isReturningPlayer(playerId, currentSeasonId);
    if (!returning) return null;

    return grantWelcomeBackCoupon(playerId);
}
