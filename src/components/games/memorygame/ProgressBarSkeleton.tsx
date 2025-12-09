"use client";

import { Skeleton } from "@/src/components/ui/skeleton";

export function ProgressBarSkeleton() {
    return (
        <div className="flex-1 flex items-center gap-3 animate-pulse">
            {/* Left score skeleton */}
            <div className="flex items-center gap-1 shrink-0">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-4 w-8" />
            </div>

            {/* Progress bar skeleton */}
            <Skeleton className="flex-1 h-2 rounded-full" />

            {/* Right score skeleton */}
            <div className="flex items-center gap-1 shrink-0">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-4 w-8" />
            </div>
        </div>
    );
}

export function LeaderboardSkeleton() {
    return (
        <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-center gap-6 py-3 px-4 bg-muted/50 rounded-xl">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-8 w-px" />
                <Skeleton className="h-12 w-24" />
            </div>

            {/* List skeleton */}
            <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                        <Skeleton className="h-5 w-12" />
                    </div>
                ))}
            </div>
        </div>
    );
}
