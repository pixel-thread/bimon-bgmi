import { prisma } from "@/lib/database";
import { getAuthEmail, userWhereEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * GET /api/bracket-matches/[id]/opponent-phone
 * Returns the opponent's phone number ONLY if the requester is a participant in that match.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getAuthEmail();
        if (!userId) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const { id: matchId } = await params;

        const user = await prisma.user.findFirst({
            where: userWhereEmail(userId),
            select: { player: { select: { id: true } } },
        });
        const playerId = user?.player?.id;
        if (!playerId) return ErrorResponse({ message: "Player not found", status: 404 });

        const match = await prisma.bracketMatch.findUnique({
            where: { id: matchId },
            select: {
                player1Id: true,
                player2Id: true,
                player1: { select: { phoneNumber: true } },
                player2: { select: { phoneNumber: true } },
            },
        });
        if (!match) return ErrorResponse({ message: "Match not found", status: 404 });

        const isP1 = match.player1Id === playerId;
        const isP2 = match.player2Id === playerId;
        if (!isP1 && !isP2) return ErrorResponse({ message: "Not a participant", status: 403 });

        // Return the OPPONENT's phone number
        const phone = isP1 ? match.player2?.phoneNumber : match.player1?.phoneNumber;

        return SuccessResponse({ data: { phoneNumber: phone ?? null } });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch", error });
    }
}
