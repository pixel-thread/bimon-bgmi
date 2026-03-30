import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { communityDb } from "@/lib/community-db";
import { GAME_CONFIGS } from "@/lib/game-config";

/**
 * GET /api/cross-game/settlement
 * Admin-only: Get settlement totals between games.
 * Returns net amounts each game owes the others (unsettled transfers).
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Get all unsettled transfers grouped by fromGame → toGame
        const transfers = await communityDb.crossGameTransfer.findMany({
            where: { isSettled: false },
            select: {
                fromGame: true,
                toGame: true,
                amount: true,
                playerEmail: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // Aggregate by game pair
        const pairTotals: Record<string, { outgoing: number; incoming: number; count: number }> = {};
        const gameNames = Object.fromEntries(
            Object.entries(GAME_CONFIGS).map(([k, v]) => [k, v.gameName])
        );

        for (const t of transfers) {
            // For each direction, accumulate
            const outKey = `${t.fromGame}→${t.toGame}`;
            if (!pairTotals[outKey]) pairTotals[outKey] = { outgoing: 0, incoming: 0, count: 0 };
            pairTotals[outKey].outgoing += t.amount;
            pairTotals[outKey].count++;

            // Reverse direction for incoming
            const inKey = `${t.toGame}→${t.fromGame}`;
            if (!pairTotals[inKey]) pairTotals[inKey] = { outgoing: 0, incoming: 0, count: 0 };
            pairTotals[inKey].incoming += t.amount;
        }

        // Build per-game summary
        const games = Object.keys(GAME_CONFIGS);
        const summary = games.map((game) => {
            const pairs = games
                .filter((g) => g !== game)
                .map((otherGame) => {
                    const key = `${game}→${otherGame}`;
                    const reverseKey = `${otherGame}→${game}`;
                    const outgoing = pairTotals[key]?.outgoing ?? 0;
                    const incoming = pairTotals[reverseKey]?.outgoing ?? 0;
                    const net = incoming - outgoing; // positive = other game owes us
                    return {
                        otherGame,
                        otherGameName: gameNames[otherGame] ?? otherGame,
                        outgoing,
                        incoming,
                        net,
                        transferCount: (pairTotals[key]?.count ?? 0) + (pairTotals[reverseKey]?.count ?? 0),
                    };
                })
                .filter((p) => p.outgoing > 0 || p.incoming > 0);

            return {
                game,
                gameName: gameNames[game] ?? game,
                pairs,
            };
        }).filter((g) => g.pairs.length > 0);

        return NextResponse.json({ data: { summary, totalTransfers: transfers.length } });
    } catch (error) {
        console.error("[GET /api/cross-game/settlement] Error:", error);
        return NextResponse.json({ error: "Failed to fetch settlement data" }, { status: 500 });
    }
}

/**
 * POST /api/cross-game/settlement
 * Admin-only: Mark transfers between two games as settled.
 * Body: { fromGame, toGame }
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const { fromGame, toGame } = await req.json();
        if (!fromGame || !toGame) {
            return NextResponse.json({ error: "fromGame and toGame required" }, { status: 400 });
        }

        // Mark all unsettled transfers between these two games (both directions)
        const result = await communityDb.crossGameTransfer.updateMany({
            where: {
                isSettled: false,
                OR: [
                    { fromGame, toGame },
                    { fromGame: toGame, toGame: fromGame },
                ],
            },
            data: {
                isSettled: true,
                settledAt: new Date(),
                settledBy: user.email,
            },
        });

        return NextResponse.json({
            success: true,
            message: `Settled ${result.count} transfers between ${fromGame} and ${toGame}`,
        });
    } catch (error) {
        console.error("[POST /api/cross-game/settlement] Error:", error);
        return NextResponse.json({ error: "Failed to settle" }, { status: 500 });
    }
}
