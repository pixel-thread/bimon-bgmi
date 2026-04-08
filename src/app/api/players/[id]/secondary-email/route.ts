import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { requireAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";

/**
 * PATCH /api/players/[id]/secondary-email
 * Admin-only: Link or unlink a secondary email for a player's User.
 * Body: { email: string | null }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Admin access required", status: 403 });
        }

        const { id: playerId } = await params;
        const { email } = (await req.json()) as { email: string | null };

        // Find the player's user
        const player = await prisma.player.findUnique({
            where: { id: playerId },
            select: { userId: true, displayName: true },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const trimmedEmail = email?.trim()?.toLowerCase() || null;

        // If setting an email, check it's not already used
        if (trimmedEmail) {
            const existing = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: trimmedEmail },
                        { secondaryEmail: trimmedEmail },
                    ],
                    NOT: { id: player.userId },
                },
                select: { email: true },
            });

            if (existing) {
                return ErrorResponse({
                    message: `Email "${trimmedEmail}" is already linked to another account (${existing.email})`,
                    status: 409,
                });
            }
        }

        await prisma.user.update({
            where: { id: player.userId },
            data: { secondaryEmail: trimmedEmail },
        });

        return SuccessResponse({
            message: trimmedEmail
                ? `Linked "${trimmedEmail}" as secondary email for ${player.displayName}`
                : `Removed secondary email for ${player.displayName}`,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update secondary email", error });
    }
}
