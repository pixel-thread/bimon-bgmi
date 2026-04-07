"use client";

import { useAuthGate } from "@/components/common/auth-gate-provider";
import { AuthRequired } from "@/components/common/auth-required";

/**
 * Layout for auth-protected pages (profile, wallet, vote, etc.)
 * Shows blurred skeleton + login modal for guests.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSignedIn } = useAuthGate();

    if (!isSignedIn) {
        return <AuthRequired />;
    }

    return <>{children}</>;
}
