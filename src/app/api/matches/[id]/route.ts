import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * DELETE /api/matches/[id]
 * Deletes a match and all associated data (cascades via schema).
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return ErrorResponse({ message: "Unauthorized", status: 403 });
        }

        const { id } = await params;

        const match = await prisma.match.findUnique({
            where: { id },
            select: { id: true, matchNumber: true, tournamentId: true },
        });

        if (!match) return ErrorResponse({ message: "Match not found", status: 404 });

        // Cascade deletes TeamStats, TeamPlayerStats, MatchPlayerPlayed, etc.
        await prisma.match.delete({ where: { id } });

        return SuccessResponse({ message: `Match #${match.matchNumber} deleted` });
    } catch (error) {
        return ErrorResponse({ message: "Failed to delete match", error });
    }
}
