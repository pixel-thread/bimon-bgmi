import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

// GET - Fetch all game scores (leaderboard)
export async function GET() {
    try {
        const leaderboard = await prisma.gameScore.findMany({
            orderBy: { highScore: "desc" },
            take: 50,
            include: {
                player: {
                    select: {
                        customProfileImageUrl: true,
                        user: {
                            select: {
                                userName: true,
                                displayName: true,
                                clerkId: true,
                            },
                        },
                    },
                },
            },
        });

        // Get Clerk images for players without custom profile images
        const clerkIdsToFetch = leaderboard
            .filter(entry => !entry.player.customProfileImageUrl)
            .map(entry => entry.player.user.clerkId);

        let clerkImageMap = new Map<string, string | null>();
        if (clerkIdsToFetch.length > 0) {
            try {
                const client = await clerkClient();
                const clerkUsers = await client.users.getUserList({
                    userId: clerkIdsToFetch,
                    limit: 50,
                });
                clerkUsers.data.forEach(user => {
                    clerkImageMap.set(user.id, user.imageUrl);
                });
            } catch (e) {
                console.log("Failed to fetch Clerk images:", e);
            }
        }

        return NextResponse.json({
            leaderboard: leaderboard.map((entry, index) => ({
                rank: index + 1,
                playerId: entry.playerId,
                playerName: entry.player.user.displayName || entry.player.user.userName,
                playerImage: entry.player.customProfileImageUrl || clerkImageMap.get(entry.player.user.clerkId) || null,
                highScore: entry.highScore,
                lastPlayedAt: entry.lastPlayedAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard" },
            { status: 500 }
        );
    }
}

// DELETE - Reset all game scores (admin only)
export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete all game scores
        await prisma.gameScore.deleteMany({});

        return NextResponse.json({
            success: true,
            message: "Leaderboard has been reset",
        });
    } catch (error) {
        console.error("Error resetting leaderboard:", error);
        return NextResponse.json(
            { error: "Failed to reset leaderboard" },
            { status: 500 }
        );
    }
}
