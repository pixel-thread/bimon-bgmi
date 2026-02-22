import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";

/**
 * POST /api/players/[id]/ban
 * Toggle ban status for a player.
 * Body: { isBanned: boolean, reason?: string }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { isBanned, reason } = await req.json();

        if (typeof isBanned !== "boolean") {
            return NextResponse.json(
                { error: "isBanned must be a boolean" },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            // Update player ban status
            await tx.player.update({
                where: { id },
                data: { isBanned },
            });

            if (isBanned) {
                // Create or update ban record
                await tx.playerBan.upsert({
                    where: { playerId: id },
                    create: {
                        playerId: id,
                        banReason: reason || "Banned by admin",
                        bannedAt: new Date(),
                    },
                    update: {
                        banReason: reason || "Banned by admin",
                        bannedAt: new Date(),
                    },
                });
            } else {
                // Remove ban record
                await tx.playerBan.deleteMany({
                    where: { playerId: id },
                });
            }
        });

        return NextResponse.json({
            isBanned,
            message: isBanned ? "Player banned" : "Player unbanned",
        });
    } catch (error) {
        console.error("Failed to update ban status:", error);
        return NextResponse.json(
            { error: "Failed to update ban status" },
            { status: 500 }
        );
    }
}
