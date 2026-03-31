import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { communityDb } from "@/lib/community-db";
import { GAME_CONFIGS, type GameMode } from "@/lib/game-config";

/**
 * GET /api/cross-game/settlement
 * Admin-only: Get settlement totals + pending settlement requests.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        // Detect current game from headers
        const headerStore = await headers();
        const currentGame = (headerStore.get("x-game-mode") as GameMode) || (process.env.NEXT_PUBLIC_GAME_MODE as GameMode) || "bgmi";

        // Get all unsettled transfers
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

        // Get pending settlement requests
        const pendingRequests = await communityDb.settlementRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { requestedAt: "desc" },
        });

        // Aggregate by game pair
        const pairTotals: Record<string, { outgoing: number; incoming: number; count: number }> = {};
        const gameNames = Object.fromEntries(
            Object.entries(GAME_CONFIGS).map(([k, v]) => [k, v.gameName])
        );

        for (const t of transfers) {
            const outKey = `${t.fromGame}→${t.toGame}`;
            if (!pairTotals[outKey]) pairTotals[outKey] = { outgoing: 0, incoming: 0, count: 0 };
            pairTotals[outKey].outgoing += t.amount;
            pairTotals[outKey].count++;

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
                    const net = incoming - outgoing;

                    // Check if there's a pending request for this pair
                    const pendingRequest = pendingRequests.find(
                        (r: { requestedByGame: string; otherGame: string }) =>
                            (r.requestedByGame === game && r.otherGame === otherGame) ||
                            (r.requestedByGame === otherGame && r.otherGame === game)
                    );

                    return {
                        otherGame,
                        otherGameName: gameNames[otherGame] ?? otherGame,
                        outgoing,
                        incoming,
                        net,
                        transferCount: (pairTotals[key]?.count ?? 0) + (pairTotals[reverseKey]?.count ?? 0),
                        pendingRequest: pendingRequest
                            ? {
                                id: pendingRequest.id,
                                requestedByGame: pendingRequest.requestedByGame,
                                netAmount: pendingRequest.netAmount,
                                transferCount: pendingRequest.transferCount,
                                requestedAt: pendingRequest.requestedAt,
                                // Does this game need to confirm it?
                                needsMyConfirmation: pendingRequest.otherGame === currentGame,
                            }
                            : null,
                    };
                })
                .filter((p) => p.outgoing > 0 || p.incoming > 0);

            return {
                game,
                gameName: gameNames[game] ?? game,
                pairs,
            };
        }).filter((g) => g.pairs.length > 0);

        return NextResponse.json({
            data: {
                summary,
                totalTransfers: transfers.length,
                currentGame,
            },
        });
    } catch (error) {
        console.error("[GET /api/cross-game/settlement] Error:", error);
        return NextResponse.json({ error: "Failed to fetch settlement data" }, { status: 500 });
    }
}

/**
 * POST /api/cross-game/settlement
 * Admin-only: Two-sided settlement flow.
 * 
 * Body:
 *   { action: "request", otherGame: "pes" }  → Create a PENDING settlement request
 *   { action: "confirm", requestId: "..." }   → Confirm & mark transfers as settled
 *   { action: "reject",  requestId: "..." }   → Reject the request
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const headerStore = await headers();
        const currentGame = (headerStore.get("x-game-mode") as GameMode) || (process.env.NEXT_PUBLIC_GAME_MODE as GameMode) || "bgmi";

        const body = await req.json();
        const { action } = body;

        // ── REQUEST: Create a pending settlement ────────────
        if (action === "request") {
            const { otherGame } = body;
            if (!otherGame || !(otherGame in GAME_CONFIGS)) {
                return NextResponse.json({ error: "Invalid target game" }, { status: 400 });
            }

            // Check no pending request already exists for this pair
            const existing = await communityDb.settlementRequest.findFirst({
                where: {
                    status: "PENDING",
                    OR: [
                        { requestedByGame: currentGame, otherGame },
                        { requestedByGame: otherGame, otherGame: currentGame },
                    ],
                },
            });
            if (existing) {
                return NextResponse.json({ error: "A settlement request is already pending" }, { status: 400 });
            }

            // Calculate current net for the request snapshot
            const transfers = await communityDb.crossGameTransfer.findMany({
                where: {
                    isSettled: false,
                    OR: [
                        { fromGame: currentGame, toGame: otherGame },
                        { fromGame: otherGame, toGame: currentGame },
                    ],
                },
            });

            const outgoing = transfers.filter((t: { fromGame: string; amount: number }) => t.fromGame === currentGame).reduce((s: number, t: { amount: number }) => s + t.amount, 0);
            const incoming = transfers.filter((t: { toGame: string; amount: number }) => t.toGame === currentGame).reduce((s: number, t: { amount: number }) => s + t.amount, 0);

            await communityDb.settlementRequest.create({
                data: {
                    requestedByGame: currentGame,
                    otherGame,
                    netAmount: incoming - outgoing,
                    transferCount: transfers.length,
                },
            });

            return NextResponse.json({
                success: true,
                message: `Settlement request sent to ${GAME_CONFIGS[otherGame as GameMode]?.gameName ?? otherGame}. Waiting for their confirmation.`,
            });
        }

        // ── CONFIRM: Other side confirms ────────────────────
        if (action === "confirm") {
            const { requestId } = body;
            if (!requestId) {
                return NextResponse.json({ error: "requestId required" }, { status: 400 });
            }

            const request = await communityDb.settlementRequest.findUnique({
                where: { id: requestId },
            });
            if (!request || request.status !== "PENDING") {
                return NextResponse.json({ error: "Invalid or already processed request" }, { status: 400 });
            }
            if (request.otherGame !== currentGame) {
                return NextResponse.json({ error: "Only the other game's admin can confirm" }, { status: 403 });
            }

            // Mark transfers settled + update request
            const [settleResult] = await communityDb.$transaction([
                communityDb.crossGameTransfer.updateMany({
                    where: {
                        isSettled: false,
                        OR: [
                            { fromGame: request.requestedByGame, toGame: request.otherGame },
                            { fromGame: request.otherGame, toGame: request.requestedByGame },
                        ],
                    },
                    data: {
                        isSettled: true,
                        settledAt: new Date(),
                        settledBy: user.email,
                    },
                }),
                communityDb.settlementRequest.update({
                    where: { id: requestId },
                    data: { status: "CONFIRMED", confirmedAt: new Date() },
                }),
            ]);

            return NextResponse.json({
                success: true,
                message: `Settled ${settleResult.count} transfers. Both sides confirmed.`,
            });
        }

        // ── REJECT: Other side rejects ──────────────────────
        if (action === "reject") {
            const { requestId } = body;
            if (!requestId) {
                return NextResponse.json({ error: "requestId required" }, { status: 400 });
            }

            const request = await communityDb.settlementRequest.findUnique({
                where: { id: requestId },
            });
            if (!request || request.status !== "PENDING") {
                return NextResponse.json({ error: "Invalid or already processed request" }, { status: 400 });
            }
            if (request.otherGame !== currentGame) {
                return NextResponse.json({ error: "Only the other game's admin can reject" }, { status: 403 });
            }

            await communityDb.settlementRequest.update({
                where: { id: requestId },
                data: { status: "REJECTED", rejectedAt: new Date() },
            });

            return NextResponse.json({
                success: true,
                message: "Settlement request rejected.",
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("[POST /api/cross-game/settlement] Error:", error);
        return NextResponse.json({ error: "Failed to process settlement" }, { status: 500 });
    }
}
