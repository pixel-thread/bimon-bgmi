import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { z } from "zod";

const ruleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    order: z.number().int().optional(),
});

// GET - Fetch all rules
export async function GET() {
    try {
        const rules = await prisma.rule.findMany({
            orderBy: { order: "asc" },
        });

        return SuccessResponse({
            data: rules,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// POST - Create a new rule
export async function POST(req: NextRequest) {
    try {
        const user = await superAdminMiddleware(req);

        const body = await req.json();
        const validatedData = ruleSchema.parse(body);

        // Get the highest order value
        const maxOrderRule = await prisma.rule.findFirst({
            orderBy: { order: "desc" },
            select: { order: true },
        });

        const newOrder = validatedData.order ?? (maxOrderRule?.order ?? 0) + 1;

        const rule = await prisma.rule.create({
            data: {
                title: validatedData.title,
                content: validatedData.content,
                order: newOrder,
                createdBy: user?.userName || "admin",
            },
        });

        return SuccessResponse({
            data: rule,
            message: "Rule created successfully",
            status: 201,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// DELETE - Delete all rules (batch delete)
export async function DELETE(req: NextRequest) {
    try {
        await superAdminMiddleware(req);

        const result = await prisma.rule.deleteMany({});

        return SuccessResponse({
            message: `Deleted ${result.count} rule(s) successfully`,
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
