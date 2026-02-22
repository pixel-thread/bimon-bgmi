import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";
import { redirect } from "next/navigation";
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

    if (!user) return null;

    return {
        id: user.id,
        clerkId: user.clerkId,
        username: user.username,
        email: user.email,
        imageUrl: user.imageUrl,
        role: user.role,
        isOnboarded: user.isOnboarded,
        player: user.player
            ? {
                id: user.player.id,
                displayName: user.player.displayName || user.username,
                category: user.player.category,
                isBanned: user.player.isBanned,
                wallet: user.player.wallet
                    ? {
                        id: user.player.wallet.id,
                        balance: user.player.wallet.balance,
                    }
                    : { id: "", balance: 0 },
            }
            : null,
    };
});

/**
 * Require an authenticated admin user.
 * Redirects to /sign-in if not authenticated, throws if not admin.
 */
export const requireAdmin = cache(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        redirect("/");
    }
    return user;
});

/**
 * Require an authenticated super admin.
 */
export const requireSuperAdmin = cache(async () => {
    const user = await getCurrentUser();
    if (!user) redirect("/sign-in");
    if (user.role !== "SUPER_ADMIN") {
        redirect("/");
    }
    return user;
});

/**
 * Get the Clerk user object (for profile data like imageUrl).
 */
export const getClerkUser = cache(async () => {
    return await currentUser();
});
