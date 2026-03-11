import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * PUT /api/rules/reorder
 * Admin only — bulk-update rule order.
 * Body: { orderedIds: string[] }
 */
export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { orderedIds } = await req.json();

        if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
            return NextResponse.json(
                { error: "orderedIds must be a non-empty array" },
                { status: 400 }
            );
        }

        // Update each rule's order in a transaction
        await prisma.$transaction(
            orderedIds.map((id: string, index: number) =>
                prisma.rule.update({
                    where: { id },
                    data: { order: index + 1 },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering rules:", error);
        return NextResponse.json(
            { error: "Failed to reorder rules" },
            { status: 500 }
        );
    }
}
