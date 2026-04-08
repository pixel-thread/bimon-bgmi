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
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 space-y-4 animate-pulse">
            {/* Hero card skeleton */}
            <div className="overflow-hidden rounded-xl border border-divider">
                <div className="relative aspect-[3/4] w-full bg-default-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
                        <div className="h-16 w-16 rounded-full bg-default-200 shrink-0" />
                        <div className="flex-1 space-y-1.5 pb-0.5">
                            <div className="h-6 w-36 rounded-lg bg-default-200" />
                            <div className="h-4 w-24 rounded-lg bg-default-200" />
                        </div>
                    </div>
                </div>
            </div>
            {/* Stats skeleton */}
            <div className="rounded-xl border border-divider p-4 space-y-3">
                <div className="h-10 w-20 rounded-lg bg-default-100 mx-auto" />
                <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex flex-col items-center gap-1">
                            <div className="h-7 w-10 rounded bg-default-100" />
                            <div className="h-2.5 w-12 rounded bg-default-100" />
                        </div>
                    ))}
                </div>
            </div>
            {/* Info skeleton */}
            <div className="rounded-xl border border-divider p-4 space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="h-3 w-16 rounded bg-default-100" />
                        <div className="h-3 w-28 rounded bg-default-100" />
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
