"use server";

import { prisma } from "@/src/lib/db/prisma";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";

/**
 * Cron endpoint to cleanup incomplete user signups.
 * Deletes users who:
 * - Have not completed onboarding (isOnboarded: false)
 * - Were created more than 7 days ago
 * 
 * This endpoint is protected by CRON_SECRET and should only be called by Vercel Cron.
 */
export async function GET(req: Request) {
    try {
        // Verify cron secret for security
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return ErrorResponse({
                message: "Unauthorized",
                status: 401,
            });
        }

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Delete incomplete users older than 7 days
        const result = await prisma.user.deleteMany({
            where: {
                isOnboarded: false,
                createdAt: { lt: sevenDaysAgo },
            },
        });

        console.log(`[Cron] Cleaned up ${result.count} incomplete user(s)`);

        return SuccessResponse({
            data: { deleted: result.count },
            message: `Successfully deleted ${result.count} incomplete user(s)`,
        });
    } catch (error) {
        console.error("[Cron] Cleanup failed:", error);
        return ErrorResponse({
            message: "Cleanup failed",
            status: 500,
        });
    }
}
