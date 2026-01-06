"use server";

import { prisma } from "@/src/lib/db/prisma";
import { clientClerk } from "@/src/lib/clerk/client";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

/**
 * DELETE: Delete a user from both Clerk and the database
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!currentUser || !["SUPER_ADMIN", "ADMIN"].includes(currentUser.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const { id } = await params;

        // Find the user to delete
        const userToDelete = await prisma.user.findUnique({
            where: { id },
            select: { id: true, clerkId: true, userName: true },
        });

        if (!userToDelete) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        // Prevent deleting yourself
        if (userToDelete.id === currentUser.id) {
            return ErrorResponse({ message: "Cannot delete yourself", status: 400 });
        }

        try {
            // Delete from Clerk first
            await clientClerk.users.deleteUser(userToDelete.clerkId);
        } catch (clerkError) {
            console.error(`[Admin] Failed to delete user from Clerk:`, clerkError);
            // Continue with database deletion even if Clerk fails
            // (user might already be deleted from Clerk)
        }

        // Delete from database (cascades to Player and related data)
        await prisma.user.delete({ where: { id } });

        console.log(`[Admin] Deleted user: ${userToDelete.userName} (${userToDelete.id})`);

        return SuccessResponse({
            data: { deleted: true },
            message: `Successfully deleted user: ${userToDelete.userName}`,
        });
    } catch (error) {
        console.error("[Admin] Failed to delete user:", error);
        return ErrorResponse({ message: "Failed to delete user", status: 500 });
    }
}
