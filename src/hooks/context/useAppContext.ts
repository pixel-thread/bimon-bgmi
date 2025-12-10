import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import http from "@/src/utils/http";
import { useSeasonStore } from "@/src/store/season";
import { useTournamentStore } from "@/src/store/tournament";
import { TournamentT } from "@/src/types/tournament";
import { MatchT } from "@/src/types/match";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

type SeasonT = Prisma.SeasonGetPayload<{ include: { teams: true } }>;

interface AppContextData {
    activeSeason: SeasonT | null;
    tournaments: TournamentT[];
    latestTournamentId: string | null;
    latestTournamentMatches: MatchT[];
}

/**
 * Combined context hook - fetches active season, tournaments, and matches
 * in a single request to eliminate waterfall loading.
 * 
 * Auto-populates season and tournament stores on load.
 */
export function useAppContext() {
    const { setSeasonId, seasonId } = useSeasonStore();
    const { setTournamentId, tournamentId } = useTournamentStore();

    const query = useQuery({
        queryKey: ["app-context"],
        queryFn: () => http.get<AppContextData>("/context"),
        select: (data) => data.data,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false,
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
        tournaments: query.data?.tournaments ?? [],
        latestTournamentId: query.data?.latestTournamentId ?? null,
        latestTournamentMatches: query.data?.latestTournamentMatches ?? [],
    };
}
