"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";

const SKIP_PATHS = ["/onboarding", "/sign-in", "/sign-up"];

/**
 * Redirects signed-in but non-onboarded users to /onboarding.
 * Place in (app) layout to guard all authenticated pages.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, isSignedIn } = useAuthUser();

    useEffect(() => {
        if (isLoading || !isSignedIn || !user) return;
        if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

        if (!user.isOnboarded) {
            router.push("/onboarding");
        }
    }, [user, isLoading, isSignedIn, pathname, router]);

    // Block rendering if user needs onboarding
    if (isSignedIn && user && !user.isOnboarded && !SKIP_PATHS.some((p) => pathname.startsWith(p))) {
        return null;
    }

    return <>{children}</>;
}
