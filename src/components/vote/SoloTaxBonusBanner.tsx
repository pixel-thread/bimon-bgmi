"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { FiGift } from "react-icons/fi";

interface SoloTaxBonusBannerProps {
    seasonId?: string;
}

/**
 * Banner showing accumulated solo tax bonus pool for the next tournament
 */
export function SoloTaxBonusBanner({ seasonId }: SoloTaxBonusBannerProps) {
    // Fetch the current solo tax pool for this season
    const { data } = useQuery({
        queryKey: ["solo-tax-pool", seasonId],
        queryFn: async (): Promise<{ amount: number }> => {
            if (!seasonId) return { amount: 0 };
            const response = await http.get(`/solo-tax-pool?seasonId=${seasonId}`);
            return (response.data as { amount: number }) || { amount: 0 };
        },
        enabled: !!seasonId,
        staleTime: 60000, // Cache for 1 minute
    });

    const bonusAmount = data?.amount || 0;

    // Don't show if no bonus pool
    if (!bonusAmount || bonusAmount <= 0) {
        return null;
    }

    return (
        <div className="mx-auto max-w-2xl mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-300/30 dark:border-amber-700/30">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
                <FiGift className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">
                    This tournament has a <span className="font-bold">+₹{bonusAmount}</span> bonus pool from previous solo taxes! 🎉
                </p>
            </div>
        </div>
    );
}
