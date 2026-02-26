import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/tournaments/[id]/stored-results
 *
 * Returns the stored PendingReward amounts for a declared tournament.
 * Used by the modal to display exact stored values without recalculation.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: { name: true, isWinnerDeclared: true },
        });

        if (!tournament) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (!tournament.isWinnerDeclared) {
            return NextResponse.json({ data: [] });
        }

        // Fetch stored rewards for this tournament (matched by tournament name in message)
        const rewards = await prisma.pendingReward.findMany({
            where: {
                message: { contains: tournament.name },
                type: { in: ["WINNER", "SOLO_SUPPORT"] },
            },
            select: {
                playerId: true,
                amount: true,
                position: true,
                isClaimed: true,
                type: true,
            },
        });

        return NextResponse.json({ data: rewards });
    } catch (error) {
        console.error("Error fetching stored results:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
