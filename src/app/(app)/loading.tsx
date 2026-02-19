import { Skeleton } from "@heroui/react";

/**
 * Loading state for the app route group.
 * Shows skeleton placeholders while pages load.
 */
export default function AppLoading() {
    return (
        <div className="space-y-6 p-4">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-32 rounded-lg" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-3">
                <Skeleton className="h-32 w-full rounded-xl" />
                <div className="grid gap-3 sm:grid-cols-2">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        </div>
    );
}
