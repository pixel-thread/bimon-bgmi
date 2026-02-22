import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/solo-tax-pool?seasonId=xxx
 *
 * Returns the current solo tax bonus pool for a season.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const seasonId = req.nextUrl.searchParams.get("seasonId");
        if (!seasonId) {
            return NextResponse.json({ data: { amount: 0, donorName: null } });
        }

        const pool = await prisma.soloTaxPool.findFirst({
            where: { seasonId },
            select: { amount: true, donorName: true },
        });

        return NextResponse.json({
            data: {
                amount: pool?.amount ?? 0,
                donorName: pool?.donorName ?? null,
            },
        });
    } catch (error) {
        console.error("Error fetching solo tax pool:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
