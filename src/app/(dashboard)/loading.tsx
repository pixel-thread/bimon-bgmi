"use client";

import { FunLoader } from "@/components/common/fun-loader";

/**
 * Loading state for the dashboard route group.
 */
export default function DashboardLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <FunLoader />
        </div>
    );
}
