import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { z } from "zod";

const updateIncomeSchema = z.object({
    amount: z.number().positive("Amount must be positive").optional(),
    description: z.string().min(1, "Description is required").optional(),
    tournamentId: z.string().nullable().optional(),
    tournamentName: z.string().nullable().optional(),
});

// PUT - Update an income entry
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await superAdminMiddleware(req);

        const { id } = await params;
        const body = await req.json();
        const validatedData = updateIncomeSchema.parse(body);

        const existingIncome = await prisma.income.findUnique({
            where: { id },
        });

        if (!existingIncome) {
            return ErrorResponse({
                message: "Income entry not found",
                status: 404,
            });
        }

        const updatedIncome = await prisma.income.update({
            where: { id },
            data: {
                amount: validatedData.amount ?? existingIncome.amount,
                description: validatedData.description ?? existingIncome.description,
                tournamentId: validatedData.tournamentId !== undefined
                    ? validatedData.tournamentId
                    : existingIncome.tournamentId,
                tournamentName: validatedData.tournamentName !== undefined
                    ? validatedData.tournamentName
                    : existingIncome.tournamentName,
            },
        });

        return SuccessResponse({
            data: updatedIncome,
            message: "Income entry updated successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// DELETE - Delete an income entry
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await superAdminMiddleware(req);

        const { id } = await params;

        const existingIncome = await prisma.income.findUnique({
            where: { id },
            include: {
                children: true,
            },
        });

        if (!existingIncome) {
            return ErrorResponse({
                message: "Income entry not found",
                status: 404,
            });
        }

        // Delete the income (children will be cascade deleted)
        await prisma.income.delete({
            where: { id },
        });

        return SuccessResponse({
            message: `Income entry deleted successfully${existingIncome.children.length > 0 ? ` (including ${existingIncome.children.length} sub-entries)` : ""}`,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
