import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db/prisma";

/**
 * POST /api/admin/merit-ratings/[playerId]/lift
 * Lift a player's merit ban (reset to 100%, remove restriction)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ playerId: string }> }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
            select: { role: true },
        });

        // Only SUPER_ADMIN can lift bans
        if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
        }

        const { playerId } = await params;

        // Check if player exists
        const player = await prisma.player.findUnique({
            where: { id: playerId },
            select: { id: true, isSoloRestricted: true },
        });

        if (!player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        // Delete all previous ratings and reset merit
        await prisma.$transaction([
            prisma.playerMeritRating.deleteMany({
                where: { toPlayerId: playerId },
            }),
            prisma.player.update({
                where: { id: playerId },
                data: {
                    meritScore: 100,
                    isSoloRestricted: false,
                    soloMatchesNeeded: 0,
                },
            }),
        ]);

        return NextResponse.json({
            message: "Ban lifted successfully",
            data: { meritScore: 100, isSoloRestricted: false },
        });
    } catch (error) {
        console.error("Error lifting ban:", error);
        return NextResponse.json({ error: "Failed to lift ban" }, { status: 500 });
    }
}
