"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

type PendingCountResponse = {
    count: number;
};

/**
 * Hook to get the count of pending UC requests where the current user is the recipient.
 * Used to show a notification dot on the Profile link.
 * Uses a lightweight endpoint that only returns a count (no heavy joins).
 */
export function usePendingUCRequests() {
    const { user } = useAuth();
    const playerId = user?.playerId || user?.player?.id;

    const { data, isLoading } = useQuery({
        queryKey: ["uc-transfers-pending-count", playerId],
        queryFn: () => http.get<PendingCountResponse>("/uc-transfers/pending-count"),
        enabled: !!playerId,
        refetchInterval: 60000, // Refetch every 60 seconds
        staleTime: 30000, // Consider data stale after 30 seconds
    });

    const pendingCount = data?.data?.count ?? 0;

    return {
        pendingCount,
        isLoading,
        hasPendingRequests: pendingCount > 0,
    };
}
