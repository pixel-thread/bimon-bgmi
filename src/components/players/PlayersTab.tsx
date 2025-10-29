"use client";
import React, { useState, useMemo, useEffect } from "react";
import { LoaderFive } from "@/src/components/ui/loader";

import { PlayerFilters } from "./PlayerFilters";
import { DynamicTopPlayersPodium } from "../ui/dynamic-top-players-podium";
import { PlayerStatsModal } from "./PlayerStatsModal";
import { usePlayerData } from "./hooks/usePlayerData";
import { PlayersTabProps } from "./types";
import { Button } from "../ui/button";
import { useAuth } from "@/src/hooks/useAuth";

import { BalanceHistoryDialog } from "./BalanceHistoryDialog";
import { BalanceAdjustmentDialog } from "./BalanceAdjustmentDialog";
import { CreatePlayerDialog } from "./CreatePlayerDialog";
import { DataTable } from "../data-table";
import { ColumnDef } from "@tanstack/react-table";
import { usePlayers } from "@/src/hooks/player/usePlayers";
import { Card } from "../teamManagementImports";
import { PlayerT } from "@/src/types/player";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const columns: ColumnDef<PlayerT>[] = [
  {
    header: "Username",
    accessorKey: "user.userName",
    cell: ({ row }) => {
      return (
        <Link href={`?player=${row.original.id}`}>
          {row.original?.user?.userName}
        </Link>
      );
    },
  },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "playerStats.wins", header: "Win" },
  { accessorKey: "playerStats.kills", header: "Kill" },
  { accessorKey: "playerStats.deaths", header: "Death" },
  { accessorKey: "playerStats.matches", header: "Matches" },
  { accessorKey: "isBanned", header: "Is Banned" },
  {
    accessorKey: "playerStats.kd",
    header: "K/D",
    cell: ({ row }) => {
      const kill = row?.original?.playerStats?.kills || 0;
      const death = row?.original?.playerStats?.deaths || 0;
      let kd = kill / death;
      // round kd to 1 decimal place
      return kd ? kd.toFixed(2) : 0;
    },
  },
];

export function PlayersTab({
  readOnly = false,
  showBalanceSummary = false,
}: PlayersTabProps) {
  const search = useSearchParams();
  const router = useRouter();
  const playerId = search.get("player") || "";
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const { isLoading } = usePlayerData(selectedSeason);
  const { user } = useAuth();
  const role = user?.role;
  const { data: players } = usePlayers();
  // States
  const [isPlayerStatsOpen, setIsPlayerStatsOpen] = useState(false);

  const [isCreatePlayerDialogOpen, setIsCreatePlayerDialogOpen] =
    useState(false);
  const [isBalanceHistoryModalOpen, setIsBalanceHistoryModalOpen] =
    useState(false);
  const [isBalanceAdjustmentModalOpen, setIsBalanceAdjustmentModalOpen] =
    useState(false);

  // Player states
  const [selectedPlayerForStats, setSelectedPlayerForStats] =
    useState<PlayerT | null>(null);
  const [selectedPlayerForBalance, setSelectedPlayerForBalance] =
    useState<PlayerT | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [sortBy, setSortBy] = useState<
    "name" | "kd" | "kills" | "matches" | "balance" | "banned"
  >("kd");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Auto-select sort order based on sort type
  useEffect(() => {
    if (sortBy === "banned") {
      setSortOrder("asc"); // Low to High for banned players
    } else {
      setSortOrder("desc"); // High to Low for all other sort types
    }
  }, [sortBy]);

  // Computed values
  // const filteredAndSortedPlayers = useMemo(() => {
  //   let filtered = players?.filter((player) => {
  //     const matchesCategory =
  //       selectedTier === "All" || player.category === selectedTier;
  //     const matchesSearch = player.user.userName
  //       .toLowerCase()
  //       .includes(searchQuery.toLowerCase());
  //     const matchesBannedFilter =
  //       sortBy !== "banned" || (sortBy === "banned" && player.isBanned);
  //     return matchesCategory && matchesSearch && matchesBannedFilter;
  //   });

  //   return filtered?.sort((a, b) => {
  //     let aValue: number | string;
  //     let bValue: number | string;

  //     switch (sortBy) {
  //       case "name":
  //         aValue = a.user.userName.toLowerCase();
  //         bValue = b.user.userName.toLowerCase();
  //         break;
  //       case "kd":
  //         aValue = a.playerStats.kd;
  //         bValue = b.playerStats.kd;
  //         break;
  //       case "kills":
  //         aValue = a.totalKills;
  //         bValue = b.totalKills;
  //         break;
  //       case "matches":
  //         aValue = a.matchesPlayed;
  //         bValue = b.matchesPlayed;
  //         break;
  //       case "balance":
  //         aValue = a.balance || 0;
  //         bValue = b.balance || 0;
  //         break;
  //       case "banned":
  //         // For banned sorting, show banned players first, then sort by balance (low to high)
  //         aValue = a.isBanned ? a.balance || 0 : Number.MAX_SAFE_INTEGER;
  //         bValue = b.isBanned ? b.balance || 0 : Number.MAX_SAFE_INTEGER;
  //         break;
  //       default:
  //         aValue = a.overallKD;
  //         bValue = b.overallKD;
  //     }

  //     if (typeof aValue === "string" && typeof bValue === "string") {
  //       return sortOrder === "asc"
  //         ? aValue.localeCompare(bValue)
  //         : bValue.localeCompare(aValue);
  //     }

  //     return sortOrder === "asc"
  //       ? (aValue as number) - (bValue as number)
  //       : (bValue as number) - (aValue as number);
  //   });
  // }, [players, searchQuery, selectedTier, sortBy, sortOrder]);

  // Players for table (excluding top 3, with pagination)

  const totalBalance = useMemo(() => {
    return players?.reduce((sum, player) => sum + (player.balance || 0), 0);
  }, [players]);

  const totalNegativeBalance = useMemo(() => {
    return players?.reduce((sum, player) => {
      if ((player.balance || 0) < 0) {
        return sum + (player.balance || 0);
      }
      return sum;
    }, 0);
  }, [players]);

  const handleOpenCreatePlayerDialog = () => {
    setIsCreatePlayerDialogOpen(true);
  };

  const handleViewPlayerStats = (player: PlayerT) => {
    setSelectedPlayerForStats(player);
    setIsPlayerStatsOpen(true);
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
        <div className="space-y-2">
          {showBalanceSummary && (
            <div className="flex gap-4 mt-2">
              <p className="text-sm text-slate-500 dark:text-muted-foreground">
                Total Balance:{" "}
                <span className="font-semibold">
                  {totalBalance?.toFixed(2)}
                </span>
              </p>
              <p className="text-sm text-slate-500 dark:text-muted-foreground">
                Negative :{" "}
                <span className="font-semibold text-red-500">
                  {totalNegativeBalance?.toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-auto flex-grow">
            <PlayerFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedSeason={selectedSeason}
              onSeasonChange={setSelectedSeason}
              selectedTier={selectedTier}
              onTierChange={setSelectedTier}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!readOnly && role === "SUPER_ADMIN" && (
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
              selectedSeason={selectedSeason}
              isLoading={isLoading}
              className="mb-6"
              onPlayerClick={handleViewPlayerStats}
            />

            <Card className="p-3 overflow-x-auto">
              <DataTable<PlayerT[]> data={players ?? []} columns={columns} />
            </Card>
          </>
        )}
      </div>

      {/* Balance History Modal */}
      <BalanceHistoryDialog
        isOpen={isBalanceHistoryModalOpen}
        onOpenChange={setIsBalanceHistoryModalOpen}
        player={selectedPlayerForBalance}
        selectedSeason={selectedSeason}
      />

      {/* Balance Adjustment Modal */}
      <BalanceAdjustmentDialog
        isOpen={isBalanceAdjustmentModalOpen}
        onOpenChange={setIsBalanceAdjustmentModalOpen}
        player={selectedPlayerForBalance}
        onBalanceUpdate={() => {}}
      />
    </div>
  );
}
