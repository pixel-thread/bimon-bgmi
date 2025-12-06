import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const playerId = (await params).id;
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const skip = (page - 1) * limit;

        const transactions = await prisma.transaction.findMany({
            where: { playerId },
            orderBy: { timestamp: "desc" },
            skip,
            take: limit,
        });

        const total = await prisma.transaction.count({
            where: { playerId },
        });

        return SuccessResponse({
            data: {
                transactions,
                pagination: {
                    total,
                    pages: Math.ceil(total / limit),
                    page,
                    limit,
                },
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
