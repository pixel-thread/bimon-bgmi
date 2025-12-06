import React from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export const VotersSkeleton = () => {
    return (
        <div className="space-y-4">
            {/* Option Skeleton */}
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="w-full h-2 rounded-full mb-3" />
                    <div className="flex justify-end">
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const VotersListSkeleton = () => {
    return (
        <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-700"
                >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
};
