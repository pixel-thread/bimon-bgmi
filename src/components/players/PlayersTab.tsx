"use client";
import React, { useState } from "react";
import { LoaderFive } from "@/src/components/ui/loader";

import { PlayerFilters } from "./PlayerFilters";
import { DynamicTopPlayersPodium } from "../ui/dynamic-top-players-podium";
import { PlayerStatsModal } from "./PlayerStatsModal";
import { usePlayerData } from "./hooks/usePlayerData";
import { Button } from "../ui/button";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

// import { BalanceHistoryDialog } from "./BalanceHistoryDialog";
import { BalanceAdjustmentDialog } from "./BalanceAdjustmentDialog";
import { CreatePlayerDialog } from "./CreatePlayerDialog";
import { DataTable } from "../data-table";
import { usePlayers } from "@/src/hooks/player/usePlayers";
import { Card } from "../teamManagementImports";
import { useRouter, useSearchParams } from "next/navigation";
import { useSeasonStore } from "@/src/store/season";
import { usePlayersColumn } from "@/src/hooks/player/usePlayersColumn";

export function PlayersTab() {
  const search = useSearchParams();
  const page = search.get("page") || "1";
  const { columns } = usePlayersColumn({ page });
  const router = useRouter();
  const ucId = search.get("uc") || "";
  const playerId = search.get("player") || "";
  const { seasonId, setSeasonId } = useSeasonStore();
  const { isLoading } = usePlayerData(seasonId);
  const { user } = useAuth();
  const role = user?.role;
  const { data: players, meta } = usePlayers({ page });
  // States
  const [isCreatePlayerDialogOpen, setIsCreatePlayerDialogOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [sortBy, setSortBy] = useState<
    "name" | "kd" | "kills" | "matches" | "balance" | "banned"
  >("kd");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleOpenCreatePlayerDialog = () => {
    setIsCreatePlayerDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Player Stats Modal */}
      <PlayerStatsModal
        isOpen={!!playerId}
        onClose={() => router.back()}
        id={playerId}
      />

      {/* Create Player Dialog */}
      <CreatePlayerDialog
        open={isCreatePlayerDialogOpen}
        onVlaueChange={setIsCreatePlayerDialogOpen}
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-auto flex-grow">
            <PlayerFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSeason={seasonId}
              onSeasonChange={setSeasonId}
              selectedTier={selectedTier}
              onTierChange={setSelectedTier}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {role === "SUPER_ADMIN" && (
              <Button
                variant="outline"
                className="h-12 px-8 text-base font-medium w-full sm:w-auto"
                onClick={handleOpenCreatePlayerDialog}
              >
                Add Player
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoaderFive text="Loading players..." />
          </div>
        ) : (
          <>
            {/* Top 3 Players Podium */}
            <DynamicTopPlayersPodium
              sortBy={sortBy}
              selectedTier={selectedTier}
              selectedSeason={seasonId}
              isLoading={isLoading}
              className="mb-6"
            />

            <Card className="p-3 overflow-x-auto">
              <DataTable meta={meta} data={players ?? []} columns={columns} />
            </Card>
          </>
        )}
      </div>

      {/* Balance History Modal */}
      {/* <BalanceHistoryDialog */}
      {/*   isOpen={isBalanceHistoryModalOpen} */}
      {/*   onOpenChange={setIsBalanceHistoryModalOpen} */}
      {/*   player={selectedPlayerForBalance} */}
      {/*   selectedSeason={seasonId} */}
      {/* /> */}

      {/* Balance Adjustment Modal */}
      <BalanceAdjustmentDialog isOpen={!!ucId} playerId={ucId} />
    </div>
  );
}
