"use client";

import { useAuthGate } from "@/components/common/auth-gate-provider";
import { AuthRequired } from "@/components/common/auth-required";

/**
 * Layout for auth-protected pages (profile, wallet, settings, etc.)
 * Shows skeleton while session loads, then blurred skeleton + login modal for guests.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn, isLoading } = useAuthGate();

    // Show a skeleton while auth session resolves (avoids blank page on refresh)
    if (isLoading) return (
        <div className="mx-auto max-w-xl px-4 py-6 sm:px-6 space-y-4 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                    <div className="h-5 w-32 rounded-lg bg-default-100" />
                    <div className="h-3 w-20 rounded bg-default-100" />
                </div>
                <div className="h-8 w-20 rounded-lg bg-default-100" />
            </div>
            {/* Content skeleton */}
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border border-divider p-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-default-100" />
                        <div className="h-3 w-1/2 rounded bg-default-100" />
                    </div>
                ))}
            </div>
        </div>
    );

    if (!isSignedIn) {
        return <AuthRequired />;
    }

    return <>{children}</>;
}
