import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/job-listings/my
 * Fetch the current player's job listing.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user?.player) {
            return NextResponse.json({ success: true, data: null });
        }

        const listing = await prisma.playerJobListing.findUnique({
            where: { playerId: user.player.id },
        });

        return NextResponse.json({ success: true, data: listing });
    } catch (error) {
        console.error("Error fetching my listing:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
