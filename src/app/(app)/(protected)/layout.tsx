"use client";

import { useAuthGate } from "@/components/common/auth-gate-provider";
import { AuthRequired } from "@/components/common/auth-required";

/**
 * Layout for auth-protected pages (profile, wallet, settings, etc.)
 * Shows nothing while session loads, then blurred skeleton + login modal for guests.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn, isLoading } = useAuthGate();

    // Don't flash auth gate while session is still loading
    if (isLoading) return null;

    if (!isSignedIn) {
        return <AuthRequired />;
    }

    return <>{children}</>;
}
