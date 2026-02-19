import { Skeleton } from "@heroui/react";

/**
 * Loading state for the dashboard route group.
 * Shows sidebar-aware skeleton placeholders.
 */
export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Title skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-4 w-56 rounded-lg" />
            </div>

            {/* Cards skeleton */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>

            {/* Table skeleton */}
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    );
}
