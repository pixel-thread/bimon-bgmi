import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { z } from "zod";

const updateRuleSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    content: z.string().min(1, "Content is required").optional(),
    order: z.number().int().optional(),
});

// PUT - Update a rule
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await superAdminMiddleware(req);

        const { id } = await params;
        const body = await req.json();
        const validatedData = updateRuleSchema.parse(body);

        const existingRule = await prisma.rule.findUnique({
            where: { id },
        });

        if (!existingRule) {
            return ErrorResponse({
                message: "Rule not found",
                status: 404,
            });
        }

        const updatedRule = await prisma.rule.update({
            where: { id },
            data: {
                title: validatedData.title ?? existingRule.title,
                content: validatedData.content ?? existingRule.content,
                order: validatedData.order ?? existingRule.order,
            },
        });

        return SuccessResponse({
            data: updatedRule,
            message: "Rule updated successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// DELETE - Delete a rule
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await superAdminMiddleware(req);

        const { id } = await params;

        const existingRule = await prisma.rule.findUnique({
            where: { id },
        });

        if (!existingRule) {
            return ErrorResponse({
                message: "Rule not found",
                status: 404,
            });
        }

        await prisma.rule.delete({
            where: { id },
        });

        return SuccessResponse({
            message: "Rule deleted successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
