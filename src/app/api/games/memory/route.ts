import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";

// GET - Fetch player's high score
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get("playerId");

        if (!playerId) {
            return NextResponse.json(
                { error: "Player ID is required" },
                { status: 400 }
            );
        }

        const gameScore = await prisma.gameScore.findUnique({
            where: { playerId },
        });

        return NextResponse.json({
            highScore: gameScore?.highScore ?? null,
            lastPlayedAt: gameScore?.lastPlayedAt ?? null,
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

        return NextResponse.json({
            success: true,
            highScore: gameScore.highScore,
            isNewHighScore,
        });
    } catch (error) {
        console.error("Error saving game score:", error);
        return NextResponse.json(
            { error: "Failed to save game score" },
            { status: 500 }
        );
    }
}
