"use server";

import { prisma } from "@/src/lib/db/prisma";
import { clientClerk } from "@/src/lib/clerk/client";
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

        // Find incomplete users older than 7 days
        const incompleteUsers = await prisma.user.findMany({
            where: {
                isOnboarded: false,
                createdAt: { lt: sevenDaysAgo },
            },
            select: { id: true, clerkId: true },
        });

        let deletedCount = 0;
        const errors: string[] = [];

        // Delete each user from both Clerk and database
        for (const user of incompleteUsers) {
            try {
                // Delete from Clerk first
                await clientClerk.users.deleteUser(user.clerkId);

                // Then delete from database
                await prisma.user.delete({ where: { id: user.id } });

                deletedCount++;
            } catch (error) {
                const errorMsg = `Failed to delete user ${user.id}: ${error}`;
                console.error(`[Cron] ${errorMsg}`);
                errors.push(errorMsg);
            }
        }

        console.log(`[Cron] Cleaned up ${deletedCount}/${incompleteUsers.length} incomplete user(s)`);

        return SuccessResponse({
            data: {
                deleted: deletedCount,
                total: incompleteUsers.length,
                errors: errors.length > 0 ? errors : undefined
            },
            message: `Successfully deleted ${deletedCount} incomplete user(s) from Clerk and database`,
        });
    } catch (error) {
        console.error("[Cron] Cleanup failed:", error);
        return ErrorResponse({
            message: "Cleanup failed",
            status: 500,
        });
    }
}
