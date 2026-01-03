"use server";

import { prisma } from "@/src/lib/db/prisma";
import { clientClerk } from "@/src/lib/clerk/client";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET: Get count of incomplete users (not onboarded, older than 7 days)
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!currentUser || !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const count = await prisma.user.count({
            where: {
                isOnboarded: false,
                createdAt: { lt: sevenDaysAgo },
            },
        });

        return SuccessResponse({
            data: { count },
            message: `Found ${count} incomplete user(s)`,
        });
    } catch (error) {
        console.error("[Admin] Failed to get incomplete users count:", error);
        return ErrorResponse({ message: "Failed to get count", status: 500 });
    }
}

/**
 * DELETE: Delete incomplete users (not onboarded, older than 7 days)
 */
export async function DELETE() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!currentUser || !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
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
                console.error(`[Admin] ${errorMsg}`);
                errors.push(errorMsg);
            }
        }

        console.log(`[Admin] Cleaned up ${deletedCount}/${incompleteUsers.length} incomplete user(s)`);

        return SuccessResponse({
            data: {
                deleted: deletedCount,
                total: incompleteUsers.length,
                errors: errors.length > 0 ? errors : undefined
            },
            message: `Successfully deleted ${deletedCount} incomplete user(s)`,
        });
    } catch (error) {
        console.error("[Admin] Cleanup failed:", error);
        return ErrorResponse({ message: "Cleanup failed", status: 500 });
    }
}
