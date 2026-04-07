"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LocationModal } from "./location-modal";

/**
 * Wrapper that checks if the player has location set.
 * If not, shows the blocking LocationModal.
 * Placed in the app layout so it triggers on any authenticated page.
 */
export function LocationGuard() {
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
    });

    // Show modal if player exists but has no location
    const needsLocation =
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
