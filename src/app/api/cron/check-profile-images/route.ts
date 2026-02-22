import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

/**
 * GET /api/cron/check-profile-images
 * Debug endpoint to check customProfileImageUrl status
 */
export async function GET() {
    const total = await prisma.player.count();
    const withCustom = await prisma.player.count({
        where: { customProfileImageUrl: { not: null } },
    });

    const sample = await prisma.player.findMany({
        where: { customProfileImageUrl: { not: null } },
        select: { displayName: true, customProfileImageUrl: true },
        take: 5,
    });

    // Check specific player
    const thugs = await prisma.player.findUnique({
        where: { id: "c46126a1-1013-4338-b34e-6ec88888f015" },
        select: { displayName: true, customProfileImageUrl: true, user: { select: { imageUrl: true, username: true } } },
    });

    return NextResponse.json({
        total,
        withCustomProfileImage: withCustom,
        sample,
        thugsPlayer: thugs,
    });
}
