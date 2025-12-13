"use client";

import { Skeleton } from "@/src/components/ui/skeleton";

export function PlayerTableSkeleton() {
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

            {/* Player Cards Skeleton */}
            <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, index) => (
                    <div
                        key={index}
                        className={`
                            rounded-xl border p-3 sm:p-4
                            ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                index === 1 ? 'bg-sky-200/20 border-sky-400/30' :
                                    index === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                                        'bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800'}
                        `}
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Rank Badge Skeleton */}
                            <Skeleton className={`
                                w-8 h-8 sm:w-10 sm:h-10 rounded-lg shrink-0
                                ${index < 3 ? 'opacity-80' : ''}
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
