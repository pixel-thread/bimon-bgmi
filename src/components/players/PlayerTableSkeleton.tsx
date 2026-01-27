"use client";

import { Skeleton } from "@/src/components/ui/skeleton";

interface PlayerTableSkeletonProps {
    showPodium?: boolean;
}

export function PlayerTableSkeleton({ showPodium = true }: PlayerTableSkeletonProps) {
    return (
        <div className="w-full space-y-3">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>

            {/* Podium Skeleton - Only show on first page */}
            {showPodium && (
                <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/80 dark:to-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
                    {/* Title */}
                    <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                        <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
                    </div>
                    {/* Podium Cards */}
                    <div className="flex items-end justify-center gap-2 sm:gap-6">
                        {/* 2nd place */}
                        <div className="w-[90px] sm:w-[110px] h-[140px] sm:h-[160px] rounded-xl bg-slate-200/50 dark:bg-slate-700/30 border-2 border-slate-300 dark:border-slate-600">
                            <div className="flex flex-col items-center justify-end h-full pb-3 gap-2">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        {/* 1st place - taller */}
                        <div className="w-[100px] sm:w-[130px] h-[170px] sm:h-[200px] rounded-xl bg-yellow-200/30 dark:bg-yellow-700/20 border-2 border-yellow-400 dark:border-yellow-600 mb-2 sm:mb-4">
                            <div className="flex flex-col items-center pt-2">
                                <Skeleton className="w-6 h-6 rounded-full" />
                            </div>
                            <div className="flex flex-col items-center justify-end h-[calc(100%-40px)] pb-3 gap-2">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                        {/* 3rd place */}
                        <div className="w-[85px] sm:w-[100px] h-[120px] sm:h-[140px] rounded-xl bg-orange-200/30 dark:bg-orange-700/20 border-2 border-orange-400 dark:border-orange-600">
                            <div className="flex flex-col items-center justify-end h-full pb-3 gap-2">
                                <Skeleton className="w-7 h-7 rounded-full" />
                                <Skeleton className="h-3 w-14" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Cards Skeleton */}
            <div className="space-y-2">
                {Array.from({ length: showPodium ? 7 : 10 }).map((_, index) => (
                    <div
                        key={index}
                        className={`
                            rounded-xl border p-3 sm:p-4
                            ${!showPodium && index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                !showPodium && index === 1 ? 'bg-sky-200/20 border-sky-400/30' :
                                    !showPodium && index === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                                        'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800'}
                        `}
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Rank Badge Skeleton */}
                            <Skeleton className={`
                                w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0
                                ${!showPodium && index < 3 ? 'opacity-80' : ''}
                            `} />

                            {/* Avatar Skeleton */}
                            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />

                            {/* Player Info Skeleton */}
                            <div className="flex-1 min-w-0 space-y-2">
                                <Skeleton className="h-4 sm:h-5 w-28 sm:w-36" />
                                <Skeleton className="h-4 w-16 rounded-full" />
                            </div>

                            {/* Stat Value Skeleton */}
                            <div className="text-right space-y-1.5">
                                <Skeleton className="h-5 sm:h-6 w-12 sm:w-14 ml-auto" />
                                <Skeleton className="h-3 w-8 ml-auto" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <Skeleton className="h-4 w-24" />
                <div className="flex items-center gap-1.5">
                    <Skeleton className="h-8 w-8 sm:w-24 rounded-md" />
                    <Skeleton className="h-8 w-8 sm:w-20 rounded-md" />
                </div>
            </div>
        </div>
    );
}
