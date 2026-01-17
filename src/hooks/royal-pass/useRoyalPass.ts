"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

interface RoyalPassData {
    hasRoyalPass: boolean;
    isActive: boolean;
    rpPrice: number;
    bonusPercentage: number;
    seasonName: string | null;
    seasonEndDate: string | null;
    expiresAt: string | null;
    totalBonusEarned: number;
    currentBalance: number;
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

    return {
        hasRoyalPass: data?.data?.hasRoyalPass ?? false,
        isActive: data?.data?.isActive ?? false,
        rpPrice: data?.data?.rpPrice ?? 35,
        bonusPercentage: data?.data?.bonusPercentage ?? 10,
        seasonName: data?.data?.seasonName ?? null,
        seasonEndDate: data?.data?.seasonEndDate ?? null,
        expiresAt: data?.data?.expiresAt ?? null,
        totalBonusEarned: data?.data?.totalBonusEarned ?? 0,
        currentBalance: data?.data?.currentBalance ?? 0,
        isLoading: !!user?.playerId && isLoading,
        isSubscribing,
        error,
        subscribe,
        refetch: () => queryClient.invalidateQueries({ queryKey: ["royal-pass"] }),
    };
}
