"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { GAME } from "@/lib/game-config";
import { PhoneRequiredModal } from "./PhoneRequiredModal";

const SKIP_PATHS = ["/onboarding", "/sign-in", "/sign-up"];
const requiresPhone = !GAME.features.hasBR; // PES only

/**
 * Redirects signed-in but non-onboarded users to /onboarding.
 * Non-authenticated users can browse freely — auth is only
 * enforced when they try to perform an action (via AuthGateProvider).
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, isSignedIn } = useAuthUser();

    const isSkipped = SKIP_PATHS.some((p) => pathname.startsWith(p));

    useEffect(() => {
        if (isLoading || isSkipped) return;
        // Only redirect if signed in but not onboarded
        if (isSignedIn && user && !user.isOnboarded) {
            router.push("/onboarding");
        }
    }, [user, isLoading, isSignedIn, isSkipped, router]);

    // Block render only for signed-in users who need onboarding
    if (!isSkipped && isSignedIn && user && !user.isOnboarded) {
        return null;
    }

    // PES: existing player missing phone — show modal overlay, don't block page
    const showPhoneModal =
        requiresPhone &&
        isSignedIn &&
        !!user?.player &&
        !user.player.phoneNumber &&
        !isSkipped;

    return (
        <>
            {children}
            {showPhoneModal && <PhoneRequiredModal isOpen />}
        </>
    );
}
