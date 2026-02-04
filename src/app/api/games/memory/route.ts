import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";

// GET - Fetch leaderboard and player's high score
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get("playerId");
        const action = searchParams.get("action") || "score";

        // Leaderboard action
        if (action === "leaderboard") {
            const limit = parseInt(searchParams.get("limit") || "10");

            const leaderboard = await prisma.gameScore.findMany({
                orderBy: { highScore: 'desc' },
                take: limit,
                include: {
                    player: {
                        select: {
                            id: true,
                            displayName: true,
                            imageUrl: true,
                        }
                    }
                }
            });

            const topScore = leaderboard.length > 0 ? leaderboard[0].highScore : 0;

            return NextResponse.json({
                success: true,
                leaderboard: leaderboard.map((g, i) => ({
                    rank: i + 1,
                    id: g.player.id,
                    name: g.player.displayName,
                    imageUrl: g.player.imageUrl,
                    score: g.highScore,
                })),
                topScore
            });
        }

        // Single player score
        if (!playerId) {
            return NextResponse.json(
                { error: "Player ID is required" },
                { status: 400 }
            );
        }

        const gameScore = await prisma.gameScore.findUnique({
            where: { playerId },
        });

        // Get player's rank
        let rank = 0;
        if (gameScore) {
            rank = await prisma.gameScore.count({
                where: { highScore: { gt: gameScore.highScore } }
            }) + 1;
        }

        // Get global top score
        const topScoreRecord = await prisma.gameScore.findFirst({
            orderBy: { highScore: 'desc' }
        });

        return NextResponse.json({
            highScore: gameScore?.highScore ?? 0,
            lastPlayedAt: gameScore?.lastPlayedAt ?? null,
            rank,
            topScore: topScoreRecord?.highScore ?? 0
        });
    } catch (error) {
        console.error("Error fetching game score:", error);
        return NextResponse.json(
            { error: "Failed to fetch game score" },
            { status: 500 }
        );
    }
}

// POST - Save/update high score
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { playerId, score } = body;

        if (!playerId || typeof score !== "number") {
            return NextResponse.json(
                { error: "Player ID and score are required" },
                { status: 400 }
            );
        }

        // Check if player exists
        const player = await prisma.player.findUnique({
            where: { id: playerId },
        });

        if (!player) {
            return NextResponse.json(
                { error: "Player not found" },
                { status: 404 }
            );
        }

        // Get existing high score
        const existingScore = await prisma.gameScore.findUnique({
            where: { playerId },
        });

        const isNewHighScore = !existingScore || score > existingScore.highScore;

        // Upsert the game score
        const gameScore = await prisma.gameScore.upsert({
            where: { playerId },
            update: {
                highScore: isNewHighScore ? score : existingScore.highScore,
                lastPlayedAt: new Date(),
            },
            create: {
                playerId,
                highScore: score,
                lastPlayedAt: new Date(),
            },
        });

        // Get rank after save
        const rank = await prisma.gameScore.count({
            where: { highScore: { gt: gameScore.highScore } }
        }) + 1;

        return NextResponse.json({
            success: true,
            highScore: gameScore.highScore,
            isNewHighScore,
            rank,
        });
    } catch (error) {
        console.error("Error saving game score:", error);
        return NextResponse.json(
            { error: "Failed to save game score" },
            { status: 500 }
        );
    }
}
