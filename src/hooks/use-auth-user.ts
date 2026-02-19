"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth as useClerkAuth } from "@clerk/nextjs";

interface AuthUser {
    id: string;
    clerkId: string;
    username: string;
    email: string | null;
    imageUrl: string | null;
    role: "SUPER_ADMIN" | "ADMIN" | "PLAYER" | "USER";
    isOnboarded: boolean;
    player: {
        id: string;
        displayName: string | null;
        category: string;
        isBanned: boolean;
        wallet: {
            id: string;
            balance: number;
        } | null;
    } | null;
}

/**
 * Client-side auth hook backed by TanStack Query.
 * Fetches user data from API, caches it, and provides auth helpers.
 */
export function useAuthUser() {
    const { isSignedIn, isLoaded } = useClerkAuth();

    const {
        data: user,
        isLoading,
        error,
        refetch,
    } = useQuery<AuthUser>({
        queryKey: ["auth-user"],
        queryFn: async () => {
            const res = await fetch("/api/auth/me");
            if (!res.ok) throw new Error("Failed to fetch user");
            const json = await res.json();
            return json.data;
        },
        enabled: isLoaded && isSignedIn,
        staleTime: 5 * 60 * 1000, // 5 min
        retry: false,
    });

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    const isSuperAdmin = user?.role === "SUPER_ADMIN";
    const isPlayer = !!user?.player;
    const balance = user?.player?.wallet?.balance ?? 0;

    return {
        user,
        isLoading: !isLoaded || isLoading,
        isSignedIn: isSignedIn ?? false,
        isAdmin,
        isSuperAdmin,
        isPlayer,
        balance,
        error,
        refetch,
    };
}
