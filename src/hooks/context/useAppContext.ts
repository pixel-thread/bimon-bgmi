import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import http from "@/src/utils/http";
import { useSeasonStore } from "@/src/store/season";
import { useTournamentStore } from "@/src/store/tournament";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { useAuth } from "./auth/useAuth";

type SeasonT = Prisma.SeasonGetPayload<{ include: { teams: true } }>;

interface AppContextData {
    activeSeason: SeasonT | null;
    latestTournamentId: string | null;
}

/**
 * Lightweight context hook - fetches only essential data for app initialization.
 * 
 * Auto-populates season and tournament stores on load.
 */
export function useAppContext() {
    const { setSeasonId, seasonId } = useSeasonStore();
    const { setTournamentId, tournamentId } = useTournamentStore();
    const { isSignedIn, isAuthLoading } = useAuth();

    const query = useQuery({
        queryKey: ["app-context"],
        queryFn: () => http.get<AppContextData>("/context"),
        select: (data) => data.data,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false,
        enabled: isSignedIn && !isAuthLoading, // Wait for auth before fetching
    });

    // Auto-populate stores when data loads
    useEffect(() => {
        if (query.data) {
            // Set season if not already set
            if (!seasonId && query.data.activeSeason?.id) {
                setSeasonId(query.data.activeSeason.id);
            }

            // Set tournament if not already set (use latest)
            if (!tournamentId && query.data.latestTournamentId) {
                setTournamentId(query.data.latestTournamentId);
            }
        }
    }, [query.data, seasonId, tournamentId, setSeasonId, setTournamentId]);

    return {
        ...query,
        activeSeason: query.data?.activeSeason ?? null,
        latestTournamentId: query.data?.latestTournamentId ?? null,
    };
}

