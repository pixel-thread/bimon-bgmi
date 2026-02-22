"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePlayers, flattenPlayers } from "@/hooks/use-players";
import { usePlayerFilters } from "@/hooks/use-player-filters";
import { PlayerFiltersBar } from "@/components/players/player-filters-bar";
import { PlayerPodium } from "@/components/players/player-podium";
import { PlayerTable } from "@/components/players/player-table";
import { PlayerStatsModal } from "@/components/players/player-stats-modal";
import { PlayersSkeleton } from "@/components/players/players-skeleton";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Wallet } from "lucide-react";

/**
 * /players — Main players page.
 * Features: search, tier filter, sort, top-3 podium, scrollable table,
 * player stats modal, infinite scroll.
 */
export default function PlayersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const playerId = searchParams.get("player") ?? "";
    const filters = usePlayerFilters();
    const { search, tier, sortBy, sortOrder, season } = filters;

    // Fetch players
    const query = usePlayers({ search, tier, sortBy, sortOrder, season });
    const { players, meta } = flattenPlayers(query.data);
    const { isSuperAdmin } = useAuthUser();
    const isLoading = query.isLoading;

    // Show podium only when no search filter is active and sorted by KD desc
    const showPodium =
        !search && tier === "All" && sortBy === "kd" && sortOrder === "desc";

    // Players for the table (skip first 3 if podium is shown)
    const tablePlayers = showPodium ? players.slice(3) : players;
    const tableStartIndex = showPodium ? 3 : 0;

    // Find selected player for modal
    const selectedPlayer = playerId
        ? players.find((p) => p.id === playerId) ?? null
        : null;

    function handlePlayerClick(id: string) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("player", id);
        router.push(`?${params.toString()}`, { scroll: false });
    }

    function handleModalClose() {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("player");
        router.push(`?${params.toString()}`, { scroll: false });
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <div className="space-y-6">
                <PlayerFiltersBar {...filters} />

                {/* UC Balance Summary — super admin only */}
                {isSuperAdmin && meta && (meta.totalBalance != null) && (
                    <div className="flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 rounded-lg bg-default-100 px-3 py-1.5">
                            <Wallet className="h-3 w-3 text-default-400" />
                            <span className="text-foreground/50">Total:</span>
                            <span
                                className={`font-semibold ${(meta.totalBalance ?? 0) >= 0
                                    ? "text-success"
                                    : "text-danger"
                                    }`}
                            >
                                {(meta.totalBalance ?? 0).toLocaleString()} UC
                            </span>
                        </div>
                        {(meta.negativeBalance ?? 0) < 0 && (
                            <div className="flex items-center gap-1.5 rounded-lg bg-danger-50 px-3 py-1.5 dark:bg-danger-50/10">
                                <span className="text-foreground/50">Negative:</span>
                                <span className="font-semibold text-danger">
                                    {(meta.negativeBalance ?? 0).toLocaleString()} UC
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                {isLoading ? (
                    <PlayersSkeleton showPodium={showPodium} />
                ) : (
                    <>
                        {/* Podium */}
                        {showPodium && players.length >= 3 && (
                            <PlayerPodium
                                players={players.slice(0, 3)}
                                onPlayerClick={handlePlayerClick}
                            />
                        )}

                        {/* Table */}
                        <PlayerTable
                            players={tablePlayers}
                            meta={meta}
                            startIndex={tableStartIndex}
                            onPlayerClick={handlePlayerClick}
                            fetchNextPage={() => query.fetchNextPage()}
                            hasNextPage={query.hasNextPage}
                            isFetchingNextPage={query.isFetchingNextPage}
                        />
                    </>
                )}
            </div>

            {/* Stats Modal */}
            <PlayerStatsModal
                isOpen={!!playerId}
                onClose={handleModalClose}
                player={selectedPlayer}
            />
        </div>
    );
}
