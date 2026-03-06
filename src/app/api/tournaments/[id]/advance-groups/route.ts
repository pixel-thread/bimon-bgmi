import { prisma } from "@/lib/database";
import { requireSuperAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { advanceGroupToKnockout } from "@/lib/logic/generateGroupKnockout";
import { type NextRequest } from "next/server";

/**
 * POST /api/tournaments/[id]/advance-groups
 * Admin confirms group stage is done → advance top 2 per group to knockout.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireSuperAdmin();
        const { id } = await params;

        const tournament = await prisma.tournament.findUnique({
            where: { id },
            select: { id: true, type: true },
        });

        if (!tournament) {
            return ErrorResponse({ message: "Tournament not found", status: 404 });
        }

        if (tournament.type !== "GROUP_KNOCKOUT") {
            return ErrorResponse({
                message: "Only GROUP_KNOCKOUT tournaments have group-to-knockout advancement",
                status: 400,
            });
        }

        const result = await advanceGroupToKnockout(id);

        return SuccessResponse({
            data: result,
            message: `Advanced top players to knockout! ${result.knockoutMatchesFilled} matches seeded.`,
        });
    } catch (error: any) {
        return ErrorResponse({
            message: error.message || "Failed to advance groups",
            error,
        });
    }
}
