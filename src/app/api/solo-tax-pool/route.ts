import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

/**
 * GET /api/solo-tax-pool?seasonId=xxx
 * Returns the current solo tax pool amount for a season
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const seasonId = searchParams.get("seasonId");

        if (!seasonId) {
            return SuccessResponse({
                message: "Solo tax pool",
                data: { amount: 0 },
            });
        }

        const pool = await prisma.soloTaxPool.findFirst({
            where: { seasonId },
        });

        return SuccessResponse({
            message: "Solo tax pool",
            data: { amount: pool?.amount || 0 },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
