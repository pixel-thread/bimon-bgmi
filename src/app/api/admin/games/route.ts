import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";

// GET - Fetch all game scores (leaderboard)
export async function GET() {
    try {
        const leaderboard = await prisma.gameScore.findMany({
            orderBy: { highScore: "desc" },
            take: 50,
            include: {
                player: {
                    include: {
                        user: {
                            select: {
                                userName: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            leaderboard: leaderboard.map((entry, index) => ({
                rank: index + 1,
                playerId: entry.playerId,
                playerName: entry.player.user.userName,
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
