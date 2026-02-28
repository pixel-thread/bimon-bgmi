"use client";

import { Skeleton } from "@heroui/react";

/**
 * Skeleton loader for the players page.
 * Shows podium placeholders + table row placeholders.
 */
export function PlayersSkeleton({ showPodium = true }: { showPodium?: boolean }) {
    return (
        <div className="space-y-6">
            {/* Podium skeleton */}
            {showPodium && (
                <div className="flex items-end justify-center gap-3 py-4 sm:gap-6 sm:py-6">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center gap-2 mt-6 sm:mt-8">
                        <Skeleton className="w-20 sm:w-28 aspect-[9/16] rounded-2xl" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-2.5 w-12 rounded" />
                    </div>
                    {/* 1st place */}
                    <div className="flex flex-col items-center gap-2">
                        <Skeleton className="w-24 sm:w-32 aspect-[9/16] rounded-2xl" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-2.5 w-12 rounded" />
                    </div>
                    {/* 3rd place */}
                    <div className="flex flex-col items-center gap-2 mt-6 sm:mt-8">
                        <Skeleton className="w-20 sm:w-28 aspect-[9/16] rounded-2xl" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-2.5 w-12 rounded" />
                    </div>
                </div>
            )}

            {/* Table skeleton */}
            <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg px-4 py-2.5"
                    >
                        <Skeleton className="h-4 w-8 rounded" />
                        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-28 rounded" />
                            <Skeleton className="h-2.5 w-20 rounded sm:hidden" />
                        </div>
                        {/* Mobile stat */}
                        <Skeleton className="h-4 w-10 rounded sm:hidden" />
                        {/* Desktop stats */}
                        <Skeleton className="hidden h-5 w-10 rounded-full sm:block" />
                        <Skeleton className="hidden h-3.5 w-12 rounded sm:block" />
                        <Skeleton className="hidden h-3.5 w-12 rounded sm:block" />
                        <Skeleton className="hidden h-3.5 w-12 rounded sm:block" />
                    </div>
                ))}
            </div>
        </div>
    );
}
