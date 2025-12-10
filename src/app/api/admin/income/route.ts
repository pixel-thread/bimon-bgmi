import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { z } from "zod";

const incomeSchema = z.object({
    amount: z.number().positive("Amount must be positive"),
    description: z.string().min(1, "Description is required"),
    tournamentId: z.string().nullable().optional(),
    tournamentName: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    isSubIncome: z.boolean().optional().default(false),
});

// GET - Fetch all income entries
export async function GET(req: NextRequest) {
    try {
        await superAdminMiddleware(req);

        const { searchParams } = new URL(req.url);
        const tournamentId = searchParams.get("tournamentId");

        const whereClause: {
            tournamentId?: string | null;
        } = {};

        if (tournamentId && tournamentId !== "all") {
            if (tournamentId === "general") {
                whereClause.tournamentId = null;
            } else {
                whereClause.tournamentId = tournamentId;
            }
        }

        const incomes = await prisma.income.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                tournament: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Calculate totals
        const total = incomes.reduce((sum: number, income) => sum + income.amount, 0);
        const thisMonth = incomes
            .filter((income) => {
                const now = new Date();
                const incomeDate = new Date(income.createdAt);
                return (
                    incomeDate.getMonth() === now.getMonth() &&
                    incomeDate.getFullYear() === now.getFullYear()
                );
            })
            .reduce((sum: number, income) => sum + income.amount, 0);

        return SuccessResponse({
            data: {
                incomes,
                totals: {
                    total,
                    thisMonth,
                    count: incomes.filter((i) => !i.isSubIncome).length,
                },
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// POST - Create a new income entry
export async function POST(req: NextRequest) {
    try {
        const user = await superAdminMiddleware(req);

        const body = await req.json();
        const validatedData = incomeSchema.parse(body);

        const income = await prisma.income.create({
            data: {
                amount: validatedData.amount,
                description: validatedData.description,
                tournamentId: validatedData.tournamentId || null,
                tournamentName: validatedData.tournamentName || null,
                parentId: validatedData.parentId || null,
                isSubIncome: validatedData.isSubIncome || false,
                createdBy: user?.userName || "admin",
            },
        });

        return SuccessResponse({
            data: income,
            message: "Income entry created successfully",
            status: 201,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
