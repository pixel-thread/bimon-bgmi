import React from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export const PollCardSkeleton = () => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl mx-auto w-full">
            {/* Poll Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-24 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Poll Options */}
            <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="relative flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 h-14"
                    >
                        <div className="flex-1">
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-2 w-full rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Poll Footer */}
            <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
            </div>
        </div>
    );
};
