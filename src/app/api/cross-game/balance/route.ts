import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPrisma } from "@/lib/database";
import { GAME_CONFIGS, type GameMode } from "@/lib/game-config";

/**
 * GET /api/cross-game/balance?game=pes
 * Check if the current player has an account on another game + their balance.
 * Matches by email (same Clerk account = same email).
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const targetGame = req.nextUrl.searchParams.get("game") as GameMode;
        if (!targetGame || !(targetGame in GAME_CONFIGS)) {
            return NextResponse.json({ error: "Invalid game" }, { status: 400 });
        }

        const targetDb = getPrisma(targetGame);
        const targetUser = await targetDb.user.findFirst({
            where: { OR: [{ email: user.email }, { secondaryEmail: user.email }] },
            include: {
                player: {
                    include: {
                        wallet: { select: { balance: true } },
                    },
                },
            },
        });

        if (!targetUser?.player) {
            return NextResponse.json({
                data: {
                    exists: false,
                    game: targetGame,
                    gameName: GAME_CONFIGS[targetGame].gameName,
                    currency: GAME_CONFIGS[targetGame].currency,
                },
            });
        }

        return NextResponse.json({
            data: {
                exists: true,
                game: targetGame,
                gameName: GAME_CONFIGS[targetGame].gameName,
                currency: GAME_CONFIGS[targetGame].currency,
                balance: targetUser.player.wallet?.balance ?? 0,
                displayName: targetUser.player.displayName ?? targetUser.username,
            },
        });
    } catch (error) {
        console.error("[GET /api/cross-game/balance] Error:", error);
        return NextResponse.json({ error: "Failed to check balance" }, { status: 500 });
    }
}
