"use client";

import { useAuthGate } from "@/components/common/auth-gate-provider";
import { AuthRequired } from "@/components/common/auth-required";

/**
 * Wrapper for pages that require authentication.
 * Shows blurred skeleton + login modal for guests.
 * Renders children normally for signed-in users.
 *
 * Usage: wrap the page content in the page component's return:
 *   export default function ProfilePage() {
 *     return <ProtectedPage>...content...</ProtectedPage>
 *   }
 */
export function ProtectedPage({ children }: { children: React.ReactNode }) {
    const { isSignedIn } = useAuthGate();

    if (!isSignedIn) {
        return <AuthRequired />;
    }

    return <>{children}</>;
}
