"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

interface StreakInfo {
    current: number;
    progress: number;
    tournamentsUntilReward: number;
    rewardThreshold: number;
    rewardAmount: number;
    lastRewardAt: string | null;
    pendingReward: number | null;
}

interface FreeOfferInfo {
    isActive: boolean;
    claimed: number;
    total: number;
    remaining: number;
}

interface PendingWinnerInfo {
    amount: number;
    position: number | null;
    tournament: string | null;
    details: {
        baseShare?: number;
        participationAdj?: number;
        repeatTax?: number;
        soloTax?: number;
    } | null;
}

interface PendingSoloSupportInfo {
    amount: number;
    message: string | null;
}

interface PendingReferralBonusInfo {
    amount: number;
    message: string | null;
}

interface RoyalPassData {
    hasRoyalPass: boolean;
    hasCurrentSeasonRoyalPass: boolean;
    currentBalance: number;
    lostDiscount?: boolean;
    freeOffer?: FreeOfferInfo;
    streak?: StreakInfo;
    pendingWinner?: PendingWinnerInfo | null;
    pendingSoloSupport?: PendingSoloSupportInfo | null;
    pendingReferralBonus?: PendingReferralBonusInfo | null;
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

    // Claim pending streak reward
    const claimStreakRewardMutation = useMutation({
        mutationFn: () => http.post("/player/claim-streak-reward"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["royal-pass"] });
            queryClient.invalidateQueries({ queryKey: ["player"] });
        },
    });

    // Claim pending winner reward
    const claimWinnerRewardMutation = useMutation({
        mutationFn: () => http.post("/player/claim-winner-reward"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["royal-pass"] });
            queryClient.invalidateQueries({ queryKey: ["player"] });
        },
    });

    // Claim pending solo support
    const claimSoloSupportMutation = useMutation({
        mutationFn: () => http.post("/player/claim-solo-support"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["royal-pass"] });
            queryClient.invalidateQueries({ queryKey: ["player"] });
        },
    });

    // Claim pending referral bonus
    const claimReferralBonusMutation = useMutation({
        mutationFn: () => http.post("/player/claim-referral-bonus"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["royal-pass"] });
            queryClient.invalidateQueries({ queryKey: ["player"] });
        },
    });

    const streakData = data?.data?.streak;
    const freeOfferData = data?.data?.freeOffer;
    const pendingWinnerData = data?.data?.pendingWinner;
    const pendingSoloSupportData = data?.data?.pendingSoloSupport;
    const pendingReferralBonusData = data?.data?.pendingReferralBonus;

    return {
        hasRoyalPass: data?.data?.hasRoyalPass ?? false,
        hasCurrentSeasonRoyalPass: data?.data?.hasCurrentSeasonRoyalPass ?? false,
        currentBalance: data?.data?.currentBalance ?? 0,
        lostDiscount: data?.data?.lostDiscount ?? false,
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
            pendingReward: streakData?.pendingReward ?? null,
        },
        // Pending winner reward
        pendingWinner: pendingWinnerData ?? null,
        // Pending solo support
        pendingSoloSupport: pendingSoloSupportData ?? null,
        // Pending referral bonus
        pendingReferralBonus: pendingReferralBonusData ?? null,
        isLoading: !!user?.playerId && isLoading,
        isSubscribing,
        error,
        subscribe,
        // Streak reward claim
        claimStreakReward: claimStreakRewardMutation.mutate,
        claimStreakRewardAsync: claimStreakRewardMutation.mutateAsync,
        isClaimingStreakReward: claimStreakRewardMutation.isPending,
        // Winner reward claim
        claimWinnerReward: claimWinnerRewardMutation.mutate,
        claimWinnerRewardAsync: claimWinnerRewardMutation.mutateAsync,
        isClaimingWinnerReward: claimWinnerRewardMutation.isPending,
        // Solo support claim
        claimSoloSupport: claimSoloSupportMutation.mutate,
        claimSoloSupportAsync: claimSoloSupportMutation.mutateAsync,
        isClaimingSoloSupport: claimSoloSupportMutation.isPending,
        // Referral bonus claim
        claimReferralBonus: claimReferralBonusMutation.mutate,
        claimReferralBonusAsync: claimReferralBonusMutation.mutateAsync,
        isClaimingReferralBonus: claimReferralBonusMutation.isPending,
        refetch: () => queryClient.invalidateQueries({ queryKey: ["royal-pass"] }),
    };
}

