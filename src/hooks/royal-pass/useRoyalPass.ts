"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

interface StreakInfo {
    current: number;
    progress: number;
    tournamentsUntilReward: number;
    rewardThreshold: number;
    rewardAmount: number;
    lastRewardAt: string | null;
}

interface FreeOfferInfo {
    isActive: boolean;
    claimed: number;
    total: number;
    remaining: number;
}

interface RoyalPassData {
    hasRoyalPass: boolean;
    currentBalance: number;
    freeOffer?: FreeOfferInfo;
    streak?: StreakInfo;
    message?: string;
}

export function useRoyalPass() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isSubscribing, setIsSubscribing] = useState(false);

    // Only fetch when user is authenticated
    const { data, error, isLoading } = useQuery({
        queryKey: ["royal-pass", user?.playerId],
        queryFn: () => http.get<RoyalPassData>("/royal-pass"),
        enabled: !!user?.playerId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });

    const subscribe = useCallback(async () => {
        setIsSubscribing(true);
        try {
            const response = await http.post<RoyalPassData>("/royal-pass");

            if (!response.success) {
                throw new Error(response.message || "Failed to subscribe");
            }

            // Refresh the data
            await queryClient.invalidateQueries({ queryKey: ["royal-pass"] });
            await queryClient.invalidateQueries({ queryKey: ["player"] });
            return { success: true, message: response.message };
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to subscribe";
            return { success: false, message };
        } finally {
            setIsSubscribing(false);
        }
    }, [queryClient]);

    const streakData = data?.data?.streak;
    const freeOfferData = data?.data?.freeOffer;

    return {
        hasRoyalPass: data?.data?.hasRoyalPass ?? false,
        currentBalance: data?.data?.currentBalance ?? 0,
        // Free offer info
        freeOffer: {
            isActive: freeOfferData?.isActive ?? false,
            claimed: freeOfferData?.claimed ?? 0,
            total: freeOfferData?.total ?? 5,
            remaining: freeOfferData?.remaining ?? 0,
        },
        // Streak info
        streak: {
            current: streakData?.current ?? 0,
            progress: streakData?.progress ?? 0,
            tournamentsUntilReward: streakData?.tournamentsUntilReward ?? 8,
            rewardThreshold: streakData?.rewardThreshold ?? 8,
            rewardAmount: streakData?.rewardAmount ?? 30,
            lastRewardAt: streakData?.lastRewardAt ?? null,
        },
        isLoading: !!user?.playerId && isLoading,
        isSubscribing,
        error,
        subscribe,
        refetch: () => queryClient.invalidateQueries({ queryKey: ["royal-pass"] }),
    };
}
