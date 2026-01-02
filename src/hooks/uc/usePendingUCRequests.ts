"use client";

import { useQuery, useIsFetching } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useState, useEffect, useRef } from "react";

type PendingCountResponse = {
    count: number;
};

/**
 * Hook to get the count of pending UC requests where the current user is the recipient.
 * Used to show a notification dot on the Profile link.
 * Uses a lightweight endpoint that only returns a count (no heavy joins).
 * 
 * Waits for players data to load first to prioritize main content.
 */
export function usePendingUCRequests() {
    const { user } = useAuth();
    const playerId = user?.playerId;
    const [playersHaveLoaded, setPlayersHaveLoaded] = useState(false);
    const hasStartedFetching = useRef(false);

    // Check if player queries are currently fetching
    const isFetchingPlayers = useIsFetching({ queryKey: ["player"] });

    // Track when players start and then finish loading
    useEffect(() => {
        if (isFetchingPlayers > 0) {
            // Players started fetching
            hasStartedFetching.current = true;
        } else if (hasStartedFetching.current && !playersHaveLoaded) {
            // Players finished fetching (were fetching, now not)
            setPlayersHaveLoaded(true);
        }
    }, [isFetchingPlayers, playersHaveLoaded]);

    const { data, isLoading } = useQuery({
        queryKey: ["uc-transfers-pending-count", playerId],
        queryFn: () => http.get<PendingCountResponse>("/uc-transfers/pending-count"),
        enabled: !!playerId && playersHaveLoaded, // Wait for players to finish loading
        staleTime: Infinity, // Only fetch on page load/refresh
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });

    const pendingCount = data?.data?.count ?? 0;

    return {
        pendingCount,
        isLoading,
        hasPendingRequests: pendingCount > 0,
    };
}



