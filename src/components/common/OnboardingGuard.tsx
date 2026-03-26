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
 * For PES: shows a phone-required modal for existing players missing a phone.
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, isSignedIn } = useAuthUser();

    const isSkipped = SKIP_PATHS.some((p) => pathname.startsWith(p));

    useEffect(() => {
        if (isLoading || !isSignedIn || !user || isSkipped) return;
        if (!user.isOnboarded) {
            router.push("/onboarding");
        }
    }, [user, isLoading, isSignedIn, isSkipped, router]);

    // Block render while auth is loading or if onboarding needed
    if (!isSkipped && (isLoading || (isSignedIn && user && !user.isOnboarded))) {
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
