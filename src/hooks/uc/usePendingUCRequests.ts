"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

type UCTransfer = {
    id: string;
    amount: number;
    type: "REQUEST" | "SEND";
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    fromPlayerId: string;
    toPlayerId: string;
};

/**
 * Hook to get the count of pending UC requests where the current user is the recipient.
 * Used to show a notification dot on the Profile link.
 */
export function usePendingUCRequests() {
    const { user } = useAuth();
    const playerId = user?.playerId || user?.player?.id;

    const { data, isLoading } = useQuery({
        queryKey: ["uc-transfers"],
        queryFn: () => http.get<UCTransfer[]>("/uc-transfers"),
        enabled: !!playerId,
        refetchInterval: 30000, // Refetch every 30 seconds
        staleTime: 15000, // Consider data stale after 15 seconds
    });

    const transfers = data?.data || [];

    // Count pending requests where the current user needs to approve
    const pendingCount = transfers.filter(
        (t) => t.status === "PENDING" && t.type === "REQUEST" && t.toPlayerId === playerId
    ).length;

    return {
        pendingCount,
        isLoading,
        hasPendingRequests: pendingCount > 0,
    };
}
