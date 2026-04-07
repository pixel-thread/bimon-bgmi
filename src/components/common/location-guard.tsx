"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/use-auth-user";
import { LocationModal } from "./location-modal";

/**
 * Checks if the signed-in player has set their location.
 * If not, shows the blocking LocationModal.
 * Guests (not signed in) are skipped entirely.
 */
export function LocationGuard() {
    const { isSignedIn } = useAuthUser();
    const [completed, setCompleted] = useState(false);

    const { data: profile } = useQuery<{
        player: {
            state: string | null;
            district: string | null;
            town: string | null;
        } | null;
    }>({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/profile");
            if (!res.ok) return null;
            const json = await res.json();
            return json.data;
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!isSignedIn, // Only fetch if signed in
    });

    // Show modal only for signed-in players missing location
    const needsLocation =
        isSignedIn &&
        !completed &&
        profile?.player &&
        (!profile.player.state || !profile.player.district || !profile.player.town);

    return (
        <LocationModal
            isOpen={!!needsLocation}
            onComplete={() => setCompleted(true)}
        />
    );
}
