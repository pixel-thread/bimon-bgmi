"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Player } from "@/src/lib/types";
import { toast } from "sonner";
import { LoaderFive } from "@/src/components/ui/loader";

import { PlayerFilters } from "./PlayerFilters";
import { DynamicTopPlayersPodium } from "../ui/dynamic-top-players-podium";
import { PlayerTable } from "./PlayerTable";
import { PlayerDialog } from "./PlayerDialog";
import { EditPlayerDialog } from "./EditPlayerDialog";
import { PlayerStatsModal } from "./PlayerStatsModal";
import { usePlayerData } from "./hooks/usePlayerData";
import { PlayersTabProps, PlayerWithStats } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/src/hooks/useAuth";
import { useTournaments } from "@/src/hooks/useTournaments";

import { BalanceHistoryDialog } from "./BalanceHistoryDialog";
import { BalanceAdjustmentDialog } from "./BalanceAdjustmentDialog";
import { CreatePlayerDialog } from "./CreatePlayerDialog";

export function PlayersTab({
  readOnly = false,
  showBalanceSummary = false,
}: PlayersTabProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const {
    players,
    isLoading,
    refetch,
    addPlayer,
    updatePlayer,
    deletePlayer,
    banPlayer,
    unbanPlayer,
  } = usePlayerData(selectedSeason);
  const { user } = useAuth();
  const role = user?.role;
  const { tournaments } = useTournaments();

  // States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPlayerStatsOpen, setIsPlayerStatsOpen] = useState(false);
  const [isCreatePlayerDialogOpen, setIsCreatePlayerDialogOpen] =
    useState(false);
  const [isBalanceHistoryModalOpen, setIsBalanceHistoryModalOpen] =
    useState(false);
  const [isBalanceAdjustmentModalOpen, setIsBalanceAdjustmentModalOpen] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Player states
  const [newPlayer, setNewPlayer] = useState<Player>({
    id: "",
    name: "",
    category: "Noob",
    phoneNumber: null,
    balance: 0,
  });

  // Create player form state
  const [newPlayerForm, setNewPlayerForm] = useState<{
    name: string;
    category: Player["category"];
    password: string;
  }>({
    name: "",
    category: "Noob",
    password: "",
  });

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayerForStats, setSelectedPlayerForStats] =
    useState<PlayerWithStats | null>(null);
  const [selectedPlayerForBalance, setSelectedPlayerForBalance] =
    useState<PlayerWithStats | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [sortBy, setSortBy] = useState<
    "name" | "kd" | "kills" | "matches" | "balance" | "banned"
  >("kd");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 10; // Exactly 10 players per page

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTier, sortBy, sortOrder, selectedSeason]);

  // Auto-select sort order based on sort type
  useEffect(() => {
    if (sortBy === "banned") {
      setSortOrder("asc"); // Low to High for banned players
    } else {
      setSortOrder("desc"); // High to Low for all other sort types
    }
  }, [sortBy]);

  // Computed values
  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = players.filter((player) => {
      const matchesCategory =
        selectedTier === "All" || player.category === selectedTier;
      const matchesSearch = player.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesBannedFilter =
        sortBy !== "banned" || (sortBy === "banned" && player.isBanned);
      return matchesCategory && matchesSearch && matchesBannedFilter;
    });

    return filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "kd":
          aValue = a.overallKD;
          bValue = b.overallKD;
          break;
        case "kills":
          aValue = a.totalKills;
          bValue = b.totalKills;
          break;
        case "matches":
          aValue = a.matchesPlayed;
          bValue = b.matchesPlayed;
          break;
        case "balance":
          aValue = a.balance || 0;
          bValue = b.balance || 0;
          break;
        case "banned":
          // For banned sorting, show banned players first, then sort by balance (low to high)
          aValue = a.isBanned ? a.balance || 0 : Number.MAX_SAFE_INTEGER;
          bValue = b.isBanned ? b.balance || 0 : Number.MAX_SAFE_INTEGER;
          break;
        default:
          aValue = a.overallKD;
          bValue = b.overallKD;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [players, searchQuery, selectedTier, sortBy, sortOrder]);

  // Players for table (excluding top 3, with pagination)
  const tablePlayersWithPagination = useMemo(() => {
    // Skip top 3 players for the table
    const playersForTable = filteredAndSortedPlayers.slice(3);

    // Apply pagination - show only exactly 10 players per page
    const startIndex = (currentPage - 1) * playersPerPage;
    const endIndex = startIndex + playersPerPage;

    const paginatedPlayers = playersForTable.slice(startIndex, endIndex);

    return paginatedPlayers;
  }, [filteredAndSortedPlayers, currentPage, playersPerPage]);

  // Total pages for pagination (excluding top 3)
  const totalPagesForTable = useMemo(() => {
    const playersForTable = filteredAndSortedPlayers.slice(3);
    return Math.ceil(playersForTable.length / playersPerPage);
  }, [filteredAndSortedPlayers, playersPerPage]);

  const totalBalance = useMemo(() => {
    return players.reduce((sum, player) => sum + (player.balance || 0), 0);
  }, [players]);

  const totalNegativeBalance = useMemo(() => {
    return players.reduce((sum, player) => {
      if ((player.balance || 0) < 0) {
        return sum + (player.balance || 0);
      }
      return sum;
    }, 0);
  }, [players]);

  // Event handlers
  const handleAddPlayer = async () => {
    setIsSaving(true);
    const success = await addPlayer(newPlayer);
    if (success) {
      setNewPlayer({
        id: "",
        name: "",
        category: "Noob",
        phoneNumber: null,
        balance: 0,
      });
      setIsAddDialogOpen(false);
    }
    setIsSaving(false);
  };

  const handleUpdatePlayer = async (player: Player): Promise<boolean> => {
    setIsSaving(true);
    const success = await updatePlayer(player);
    if (success) {
      toast.success("Player updated successfully!");
      setIsEditDialogOpen(false);
      setEditingPlayer(null);
    } else {
      toast.error("Failed to update player.");
    }
    setIsSaving(false);
    return success;
  };

  const handleEditPlayer = (player: PlayerWithStats) => {
    setEditingPlayer(player);
    setIsEditDialogOpen(true);
  };

  const handleDeletePlayer = async (playerId: string) => {
    return await deletePlayer(playerId);
  };

  const handleBanPlayer = async (
    playerId: string,
    banData: { reason: string; duration: number; bannedBy: string },
  ) => {
    return await banPlayer(playerId, banData);
  };

  const handleUnbanPlayer = async (playerId: string) => {
    return await unbanPlayer(playerId);
  };

  const handleOpenCreatePlayerDialog = () => {
    if (role === "SUPER_ADMIN") {
      const defaultPassword = Math.random().toString(36).slice(-8);
      setNewPlayerForm({
        name: "",
        category: "Noob",
        password: defaultPassword,
      });
    } else {
      setNewPlayerForm({
        name: "",
        category: "Noob",
        password: "",
      });
    }
    setIsCreatePlayerDialogOpen(true);
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerForm.name.trim()) {
      toast.error("Player name is required");
      return;
    }

    if (role === "SUPER_ADMIN" && !newPlayerForm.password.trim()) {
      toast.error("Password is required");
      return;
    }

    setIsSaving(true);
    try {
      const existingPlayer = players.find(
        (p) => p.name.toLowerCase() === newPlayerForm.name.trim().toLowerCase(),
      );

      if (existingPlayer) {
        toast.error("A player with this name already exists");
        setIsSaving(false);
        return;
      }

      const playerId = `${newPlayerForm.category
        .toLowerCase()
        .replace(" ", "_")}_${newPlayerForm.name
        .replace(/\s+/g, "_")
        .toLowerCase()}_${Date.now()}`;

      const playerData = {
        id: playerId,
        name: newPlayerForm.name.trim(),
        category: newPlayerForm.category,
        phoneNumber: null,
        balance: 0,
        // Persist the generated/entered password for initial login
        loginPassword:
          role === "SUPER_ADMIN" && newPlayerForm.password
            ? newPlayerForm.password.trim()
            : undefined,
      };

      const success = await addPlayer(playerData);
      if (success) {
        toast.success("Player created successfully");
        setNewPlayerForm({ name: "", category: "Noob", password: "" });
        setIsCreatePlayerDialogOpen(false);
      } else {
        toast.error("Failed to create player account.");
      }
    } catch (error) {
      console.error("Error creating player:", error);
      toast.error("Failed to create player");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewPlayerStats = (player: PlayerWithStats) => {
    setSelectedPlayerForStats(player);
    setIsPlayerStatsOpen(true);
  };

  const handleViewBalanceHistory = (player: PlayerWithStats) => {
    setSelectedPlayerForBalance(player);
    setIsBalanceHistoryModalOpen(true);
  };

  const handleAdjustBalance = (player: PlayerWithStats) => {
    setSelectedPlayerForBalance(player);
    setIsBalanceAdjustmentModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Player Stats Modal */}
      {selectedPlayerForStats && (
        <PlayerStatsModal
          isOpen={isPlayerStatsOpen}
          onClose={() => setIsPlayerStatsOpen(false)}
          player={selectedPlayerForStats}
          onViewBalanceHistory={handleViewBalanceHistory}
          onAdjustBalance={handleAdjustBalance}
          onEditPlayer={handleEditPlayer}
          userRole={role}
          tournaments={tournaments}
        />
      )}

      {/* Add Player Dialog */}
      {isAddDialogOpen && (
        <PlayerDialog
          isOpen={isAddDialogOpen}
          onClose={() => {
            setIsAddDialogOpen(false);
          }}
          onSave={handleAddPlayer}
          player={newPlayer}
          onPlayerChange={setNewPlayer}
          isSaving={isSaving}
          title="Add New Player"
          saveButtonText="Add Player"
        />
      )}

      {/* Edit Player Dialog */}
      {isEditDialogOpen && editingPlayer && (
        <EditPlayerDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingPlayer(null);
          }}
          player={editingPlayer}
          onSave={handleUpdatePlayer}
          onDelete={handleDeletePlayer}
          onBan={handleBanPlayer}
          onUnban={handleUnbanPlayer}
          isSaving={isSaving}
          tournaments={tournaments}
        />
      )}

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
                <span className="font-semibold">{totalBalance.toFixed(2)}</span>
              </p>
              <p className="text-sm text-slate-500 dark:text-muted-foreground">
                Negative :{" "}
                <span className="font-semibold text-red-500">
                  {totalNegativeBalance.toFixed(2)}
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
              players={filteredAndSortedPlayers}
              sortBy={sortBy}
              selectedTier={selectedTier}
              selectedSeason={selectedSeason}
              isLoading={isLoading}
              className="mb-6"
              onPlayerClick={handleViewPlayerStats}
            />

            <div className="overflow-x-auto">
              <PlayerTable
                players={tablePlayersWithPagination}
                sortBy={sortBy}
                onPlayerClick={handleViewPlayerStats}
                tournaments={tournaments}
                startingIndex={3 + (currentPage - 1) * playersPerPage} // Start from 4 (index 3)
                currentPage={currentPage}
                totalPages={totalPagesForTable}
                onPageChange={setCurrentPage}
              />
            </div>
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
        onBalanceUpdate={() => {
          // Manually refresh the data after balance update
          refetch();
        }}
      />
    </div>
  );
}
