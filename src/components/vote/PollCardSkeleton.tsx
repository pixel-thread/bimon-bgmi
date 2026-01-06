"use client";

import React from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export const PollCardSkeleton = () => {
    return (
        <div className="rounded-xl overflow-hidden max-w-2xl mx-auto w-full bg-gradient-to-br from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 dark:from-violet-600/30 dark:via-purple-600/30 dark:to-fuchsia-600/30">
            {/* Poll Header with Prize Pool */}
            <div className="relative p-6 pb-8 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500">
                {/* Title and Badge Row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <Skeleton className="h-6 w-3/4 bg-white/30" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-md bg-white/30" />
                </div>

                {/* Prize Pool Display */}
                <div className="mt-4 flex items-center justify-center gap-3">
                    <span className="text-3xl opacity-50">🏆</span>
                    <div className="text-center space-y-1">
                        <Skeleton className="h-3 w-16 mx-auto bg-white/30" />
                        <Skeleton className="h-8 w-24 mx-auto bg-white/30" />
                    </div>
                </div>

                {/* Team Type Badge */}
                <div className="absolute bottom-2 left-3">
                    <Skeleton className="h-5 w-12 rounded-md bg-white/30" />
                </div>
            </div>

            {/* Poll Options */}
            <div className="p-6 space-y-3 bg-white/50 dark:bg-gray-800/50">
                {["IN", "OUT", "SOLO"].map((option) => (
                    <div
                        key={option}
                        className="relative flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                    </div>
                ))}
            </div>

            {/* Poll Footer */}
            <div className="px-6 pb-6 bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl" />
            </div>
        </div>
    );
};
