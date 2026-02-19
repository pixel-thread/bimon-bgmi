import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { prisma } from "@/lib/database";

/**
 * Get the current authenticated user from the database.
 * Cached per request — safe to call multiple times.
 */
export const getCurrentUser = cache(async () => {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    const user = await prisma.user.findUnique({
        where: { clerkId },
        include: {
            player: {
                include: {
                    wallet: true,
                },
            },
        },
    });

    return user;
});

/**
 * Require an authenticated admin user.
 * Throws if not authenticated or not an admin.
 */
export const requireAdmin = cache(async () => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        throw new Error("Forbidden: Admin access required");
    }
    return user;
});

/**
 * Require an authenticated super admin.
 */
export const requireSuperAdmin = cache(async () => {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    if (user.role !== "SUPER_ADMIN") {
        throw new Error("Forbidden: Super Admin access required");
    }
    return user;
});

/**
 * Get the Clerk user object (for profile data like imageUrl).
 */
export const getClerkUser = cache(async () => {
    return await currentUser();
});
