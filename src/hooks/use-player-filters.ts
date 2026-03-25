"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { GAME } from "@/lib/game-config";

const DEFAULT_SORT = GAME.features.hasBR ? "kd" : "winRate";

export interface SeasonDTO {
    id: string;
    name: string;
    status: string;
    isCurrent: boolean;
}

export interface PlayerFilters {
    search: string;
    setSearch: (v: string) => void;
    tier: string;
    setTier: (v: string) => void;
    sortBy: string;
    setSortBy: (v: string) => void;
    sortOrder: "asc" | "desc";
    setSortOrder: (v: "asc" | "desc") => void;
    season: string;
    setSeason: (v: string) => void;
    seasons: SeasonDTO[];
    currentSeasonId: string;
    tierCounts: Record<string, number>;
    hasActiveFilters: boolean;
    resetFilters: () => void;
    /** Call when popover opens to trigger lazy data fetching */
    onFilterOpen: () => void;
}

/**
 * Manages all player filter state: search, tier, sort, season.
 * Seasons & tier counts are lazy-loaded only when `onFilterOpen` is called.
 */
export function usePlayerFilters(): PlayerFilters {
    const [search, setSearch] = useState("");
    const [tier, setTier] = useState("All");
    const [sortBy, setSortBy] = useState(DEFAULT_SORT);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [season, setSeason] = useState("");
    const [filterOpened, setFilterOpened] = useState(false);

    const onFilterOpen = useCallback(() => setFilterOpened(true), []);

    // Fetch seasons — eagerly on mount so stats default to active season
    const { data: seasons = [] } = useQuery<SeasonDTO[]>({
        queryKey: ["seasons"],
        queryFn: async () => {
            const res = await fetch("/api/seasons");
            if (!res.ok) return [];
            const json = await res.json();
            return json.data ?? [];
        },
        staleTime: 5 * 60 * 1000,
    });

    // Fetch tier counts — only after popover has been opened, per-season
    const { data: tierCounts = {} } = useQuery<Record<string, number>>({
        queryKey: ["tier-counts", season],
        queryFn: async () => {
            const params = season ? `?season=${season}` : "";
            const res = await fetch(`/api/players/tier-counts${params}`);
            if (!res.ok) return {};
            const json = await res.json();
            return json.data ?? {};
        },
        staleTime: 5 * 60 * 1000,
        enabled: filterOpened && !!season,
    });

    // Auto-select the active season once loaded
    useEffect(() => {
        if (seasons.length > 0 && !season) {
            const current = seasons.find((s) => s.isCurrent);
            if (current) setSeason(current.id);
        }
    }, [seasons, season]);

    const currentSeasonId = seasons.find((s) => s.isCurrent)?.id ?? "";

    const hasActiveFilters =
        tier !== "All" ||
        sortBy !== DEFAULT_SORT ||
        sortOrder !== "desc" ||
        (currentSeasonId && season !== currentSeasonId);

    function resetFilters() {
        setSeason(currentSeasonId);
        setTier("All");
        setSortBy(DEFAULT_SORT);
        setSortOrder("desc");
    }

    return {
        search,
        setSearch,
        tier,
        setTier,
        sortBy,
        setSortBy,
        sortOrder,
        setSortOrder,
        season,
        setSeason,
        seasons,
        currentSeasonId,
        tierCounts,
        hasActiveFilters: !!hasActiveFilters,
        resetFilters,
        onFilterOpen,
    };
}
