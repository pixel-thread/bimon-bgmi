import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/notifications/backfill-winners
 *
 * One-time utility: creates Notification records for PendingReward(WINNER)
 * entries that don't already have a matching notification.
 * Super-admin only.
 */

function getOrdinal(n: number): string {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Find all unclaimed WINNER rewards
        const unclaimedRewards = await prisma.pendingReward.findMany({
            where: { type: "WINNER", isClaimed: false },
            include: {
                player: {
                    select: { id: true, userId: true, displayName: true },
                },
            },
        });

        if (unclaimedRewards.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No unclaimed winner rewards found",
                created: 0,
            });
        }

        // For each reward, check if a notification already exists
        let created = 0;
        const skipped: string[] = [];

        for (const reward of unclaimedRewards) {
            const tournamentName = reward.message?.replace(/^\d+(st|nd|rd|th) Place - /, "") || "";

            // Check if notification already exists for this player + tournament
            const existing = await prisma.notification.findFirst({
                where: {
                    playerId: reward.playerId,
                    type: "tournament",
                    message: { contains: tournamentName },
                },
            });

            if (existing) {
                skipped.push(reward.player.displayName || reward.playerId);
                continue;
            }

            await prisma.notification.create({
                data: {
                    userId: reward.player.userId,
                    playerId: reward.player.id,
                    title: `🏆 You won ${getOrdinal(reward.position ?? 0)} place!`,
                    message: `You earned ${reward.amount} UC in ${tournamentName}. Tap to claim your reward!`,
                    type: "tournament",
                    link: "/notifications",
                },
            });
            created++;
        }

        return NextResponse.json({
            success: true,
            message: `Backfilled ${created} notifications (${skipped.length} already existed)`,
            created,
            skipped: skipped.length,
        });
    } catch (error) {
        console.error("Error backfilling notifications:", error);
        return NextResponse.json({ error: "Failed to backfill" }, { status: 500 });
    }
}
