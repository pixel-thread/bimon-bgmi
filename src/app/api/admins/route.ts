import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * GET /api/admins?role=ALL|SUPER_ADMIN|ADMIN|PLAYER|USER&search=xxx
 * Fetches users. Only accessible by super admins.
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const roleFilter = searchParams.get("role") || "ALL";
        const search = searchParams.get("search") || "";

        const where: any = {};
        if (roleFilter && roleFilter !== "ALL") {
            where.role = roleFilter;
        }
        if (search) {
            where.OR = [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { player: { displayName: { contains: search, mode: "insensitive" } } },
            ];
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                username: true,
                email: true,
                imageUrl: true,
                role: true,
                createdAt: true,
                player: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
            orderBy: [
                { role: "asc" },
                { createdAt: "desc" },
            ],
        });

        return SuccessResponse({ data: users, cache: CACHE.NONE });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch users", error });
    }
}

/**
 * DELETE /api/admins
 * Deletes a user and all related data. Super admin only.
 */
export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, role: true },
        });

        if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const { userId: targetUserId } = await request.json();
        if (!targetUserId) {
            return ErrorResponse({ message: "userId is required", status: 400 });
        }

        // Prevent deleting yourself
        if (targetUserId === currentUser.id) {
            return ErrorResponse({ message: "Cannot delete yourself", status: 400 });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                username: true,
                role: true,
                player: { select: { id: true } },
            },
        });

        if (!targetUser) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        // If user has a player, delete player data first (cascades handle most)
        if (targetUser.player) {
            const playerId = targetUser.player.id;

            // Delete related records that might not cascade
            await prisma.$transaction([
                prisma.teamPlayerStats.deleteMany({ where: { playerId } }),
                prisma.playerStats.deleteMany({ where: { playerId } }),
                prisma.matchPlayerPlayed.deleteMany({ where: { playerId } }),
                prisma.playerPollVote.deleteMany({ where: { playerId } }),
                prisma.pendingReward.deleteMany({ where: { playerId } }),
                prisma.uCTransfer.deleteMany({ where: { OR: [{ fromPlayerId: playerId }, { toPlayerId: playerId }] } }),
                prisma.transaction.deleteMany({ where: { playerId } }),
                prisma.pushSubscription.deleteMany({ where: { playerId } }),
                prisma.playerMeritRating.deleteMany({ where: { OR: [{ fromPlayerId: playerId }, { toPlayerId: playerId }] } }),
            ]);

            // Delete wallet
            await prisma.wallet.deleteMany({ where: { playerId } });

            // Delete streak and ban
            await prisma.playerStreak.deleteMany({ where: { playerId } });
            await prisma.playerBan.deleteMany({ where: { playerId } });

            // Delete job listing
            await prisma.playerJobListing.deleteMany({ where: { playerId } });

            // Delete referral
            await prisma.referral.deleteMany({ where: { referredPlayerId: playerId } });

            // Delete the player (this will cascade to remove from teams, matches, etc.)
            await prisma.player.delete({ where: { id: playerId } });
        }

        // Delete notifications
        await prisma.notification.deleteMany({ where: { userId: targetUserId } });

        // Delete referrals given
        await prisma.referral.deleteMany({ where: { promoterId: targetUserId } });

        // Delete the user
        await prisma.user.delete({ where: { id: targetUserId } });

        return SuccessResponse({ data: { deleted: targetUser.username } });
    } catch (error) {
        return ErrorResponse({ message: "Failed to delete user", error });
    }
}
