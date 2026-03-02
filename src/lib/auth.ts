import { auth as nextAuth } from "@/lib/auth-config";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/database";

/**
 * Get the current authenticated user from the database.
 * Looks up by email (from NextAuth Google session).
 * Auto-creates a DB user record for new users.
 * Cached per request — safe to call multiple times.
 */
export const getCurrentUser = cache(async () => {
    const session = await nextAuth();
    if (!session?.user?.email) return null;

    const email = session.user.email;

    let user = await prisma.user.findUnique({
        where: { email },
        include: {
            player: {
                include: {
                    wallet: true,
                },
            },
        },
    });

    if (!user) {
        // New user — auto-create DB record
        const username =
            (session.user.name || "user")
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "") +
            Math.floor(Math.random() * 9000 + 1000);

        user = await prisma.user.create({
            data: {
                clerkId: `google_${Date.now()}`, // placeholder for backward compat
                username,
                email,
                imageUrl: session.user.image || null,
            },
            include: {
                player: {
                    include: {
                        wallet: true,
                    },
                },
            },
        });
    }

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
 * Helper: get the current session's email (used in API routes).
 * Returns null if not authenticated.
 */
export const getAuthEmail = cache(async (): Promise<string | null> => {
    const session = await nextAuth();
    return session?.user?.email ?? null;
});

/**
 * Helper: get the current session's user image.
 */
export const getAuthImage = cache(async (): Promise<string | null> => {
    const session = await nextAuth();
    return session?.user?.image ?? null;
});

/**
 * Helper: get the current session's user name.
 */
export const getAuthName = cache(async (): Promise<string | null> => {
    const session = await nextAuth();
    return session?.user?.name ?? null;
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
