"use client";

import { PubgmiLogo } from "@/components/common/pubgmi-logo";

/**
 * Loading state for the dashboard route group.
 * Shows the branded PUBGMI glitch animation as a centered loader.
 */
export default function DashboardLoading() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <PubgmiLogo variant="hero" className="text-3xl text-foreground/30" />
        </div>
    );
}
