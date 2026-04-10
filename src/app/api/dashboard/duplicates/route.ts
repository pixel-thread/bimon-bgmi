import { NextRequest, NextResponse } from "next/server";
import { getRequestPrisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { scanAllPlayersForDuplicates } from "@/lib/duplicate-check";

/**
 * GET /api/dashboard/duplicates
 * Returns all DuplicateAlert records with player details. Super-admin only.
 */
export async function GET() {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const db = await getRequestPrisma();

        const alerts = await db.duplicateAlert.findMany({
            orderBy: [{ isReviewed: "asc" }, { createdAt: "desc" }],
        });

        // Collect all unique player IDs
        const playerIds = new Set<string>();
        for (const a of alerts) {
            playerIds.add(a.player1Id);
            playerIds.add(a.player2Id);
        }

        // Batch-fetch player details
        const players = await db.player.findMany({
            where: { id: { in: [...playerIds] } },
            select: {
                id: true,
                displayName: true,
                phoneNumber: true,
                category: true,
                createdAt: true,
                user: {
                    select: {
                        username: true,
                        email: true,
                        secondaryEmail: true,
                        imageUrl: true,
                    },
                },
            },
        });

        const playerMap = new Map(players.map((p) => [p.id, p]));

        // Enrich alerts with player details
        const enriched = alerts.map((alert) => ({
            id: alert.id,
            matchType: alert.matchType,
            matchValue: alert.matchValue,
            isReviewed: alert.isReviewed,
            reviewNote: alert.reviewNote,
            createdAt: alert.createdAt,
            player1: playerMap.get(alert.player1Id) ?? { id: alert.player1Id, displayName: "Deleted", user: null },
            player2: playerMap.get(alert.player2Id) ?? { id: alert.player2Id, displayName: "Deleted", user: null },
        }));

        const unreviewedCount = alerts.filter((a) => !a.isReviewed).length;

        return NextResponse.json({
            data: { alerts: enriched, unreviewedCount, totalCount: alerts.length },
        });
    } catch (error) {
        console.error("Duplicates GET error:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

/**
 * POST /api/dashboard/duplicates
 * Actions: "scan" (full scan) or "dismiss" (mark as reviewed).
 */
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const db = await getRequestPrisma();
        const body = await req.json();

        if (body.action === "scan") {
            const count = await scanAllPlayersForDuplicates(db);
            return NextResponse.json({
                message: count > 0 ? `Found ${count} new suspicious matches` : "No new duplicates found",
                data: { newAlerts: count },
            });
        }

        if (body.action === "dismiss" && body.alertId) {
            await db.duplicateAlert.update({
                where: { id: body.alertId },
                data: {
                    isReviewed: true,
                    reviewNote: body.note || null,
                },
            });
            return NextResponse.json({ message: "Alert dismissed" });
        }

        if (body.action === "undismiss" && body.alertId) {
            await db.duplicateAlert.update({
                where: { id: body.alertId },
                data: { isReviewed: false, reviewNote: null },
            });
            return NextResponse.json({ message: "Alert reopened" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Duplicates POST error:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
