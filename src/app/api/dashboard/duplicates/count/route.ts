import { NextResponse } from "next/server";
import { getRequestPrisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/dashboard/duplicates/count
 * Returns count of unreviewed duplicate alerts. Admin only, lightweight.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
            return NextResponse.json({ data: { count: 0 } });
        }

        const db = await getRequestPrisma();
        const count = await db.duplicateAlert.count({
            where: { isReviewed: false },
        });

        return NextResponse.json({ data: { count } });
    } catch {
        return NextResponse.json({ data: { count: 0 } });
    }
}
