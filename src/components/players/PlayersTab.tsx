"use client";
import React, { useState } from "react";

import { PlayerFilters } from "./PlayerFilters";
import { PlayerStatsModal } from "./PlayerStatsModal";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

import { BalanceHistoryDialog } from "./BalanceHistoryDialog";
import { BalanceAdjustmentDialog } from "./BalanceAdjustmentDialog";

import { CustomPlayerTable } from "./CustomPlayerTable";
import { PlayerTableSkeleton } from "./PlayerTableSkeleton";
import { usePlayers } from "@/src/hooks/player/usePlayers";
import { useRouter, useSearchParams } from "next/navigation";
import { useSeasonStore } from "@/src/store/season";

export function PlayersTab() {
  const search = useSearchParams();
  const page = search.get("page") || "1";
  const router = useRouter();
  const ucId = search.get("uc") || "";
  const historyId = search.get("history") || "";
  const playerId = search.get("player") || "";
  const { seasonId, setSeasonId } = useSeasonStore();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";


  const [query, setQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [sortBy, setSortBy] = useState<
    "name" | "kd" | "kills" | "matches" | "balance" | "banned"
  >("kd");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Reset pagination to page 1 when search/filter changes
  const resetToFirstPage = () => {
    const params = new URLSearchParams(search.toString());
    if (params.get("page") !== "1") {
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  const handleSearchChange = (newQuery: string) => {
    setQuery(newQuery);
    resetToFirstPage();
  };

  const handleTierChange = (newTier: string) => {
    setSelectedTier(newTier);
    resetToFirstPage();
  };

  const handleSortByChange = (newSortBy: "name" | "kd" | "kills" | "matches" | "balance" | "banned") => {
    setSortBy(newSortBy);
    resetToFirstPage();
  };

  const handleSortOrderChange = (newSortOrder: "asc" | "desc") => {
    setSortOrder(newSortOrder);
    resetToFirstPage();
  };

  const { data: players, meta, isFetching: isLoading } = usePlayers({
    page,
    search: query,
    tier: selectedTier,
    sortBy,
    sortOrder,
  });



  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Player Stats Modal */}
      {(() => {
        const selectedPlayer = players?.find(p => p.id === playerId);
        return (
          <PlayerStatsModal
            key={playerId}
            isOpen={!!playerId}
            onClose={() => {
              const params = new URLSearchParams(search.toString());
              params.delete("player");
              router.push(`?${params.toString()}`, { scroll: false });
            }}
            id={playerId}
            initialData={selectedPlayer ? {
              id: selectedPlayer.id,
              isBanned: selectedPlayer.isBanned,
              userName: selectedPlayer.userName,
              displayName: selectedPlayer.displayName,
              category: selectedPlayer.category,
              kd: Number(selectedPlayer.kd),
              kills: selectedPlayer.kills,
              matches: selectedPlayer.matches,
              deaths: selectedPlayer.deaths,
              imageUrl: selectedPlayer.profileImageUrl || selectedPlayer.imageUrl,
              balance: selectedPlayer.uc,
              hasRoyalPass: selectedPlayer.hasRoyalPass,
            } : undefined}
          />
        );
      })()}

      <div className="space-y-6">
        {/* Balance Stats for Super Admin */}
        {isSuperAdmin && meta && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md">
              <span className="text-zinc-500 dark:text-zinc-400">Total:</span>
              <span className={`font-semibold ${(meta.totalBalance ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {(meta.totalBalance ?? 0).toLocaleString()} UC
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2.5 py-1 rounded-md">
              <span className="text-zinc-500 dark:text-zinc-400">Negative:</span>
              <span className="font-semibold text-red-500">
                {(meta.negativeBalance ?? 0).toLocaleString()} UC
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-auto flex-grow">
            <PlayerFilters
              searchQuery={query}
              onSearchChange={handleSearchChange}
              selectedSeason={seasonId}
              onSeasonChange={setSeasonId}
              selectedTier={selectedTier}
              onTierChange={handleTierChange}
              sortBy={sortBy}
              onSortByChange={handleSortByChange}
              sortOrder={sortOrder}
              onSortOrderChange={handleSortOrderChange}
            />
          </div>
        </div>

        {isLoading || !seasonId ? (
          <PlayerTableSkeleton showPodium={page === "1" && !query} />
        ) : (
          <CustomPlayerTable data={players ?? []} meta={meta} sortBy={sortBy} />
        )}
      </div>

      {/* Balance History Modal */}
      <BalanceHistoryDialog
        isOpen={!!historyId}
        onOpenChange={() => {
          const params = new URLSearchParams(search.toString());
          params.delete("history");
          router.push(`?${params.toString()}`, { scroll: false });
        }}
        playerId={historyId}
        selectedSeason={seasonId}
      />

      {/* Balance Adjustment Modal */}
      <BalanceAdjustmentDialog isOpen={!!ucId} playerId={ucId} />
    </div>
  );
}
