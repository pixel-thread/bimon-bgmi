import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";

// GET - Fetch total funds (public endpoint)
export async function GET(req: NextRequest) {
    try {
        // Get all incomes that start with "fund" (case-insensitive)
        const fundIncomes = await prisma.income.findMany({
            where: {
                description: {
                    startsWith: "Fund",
                    mode: "insensitive",
                },
            },
            select: {
                amount: true,
            },
        });

        const totalFunds = fundIncomes.reduce((sum, i) => sum + i.amount, 0);

        return SuccessResponse({
            data: { totalFunds },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
