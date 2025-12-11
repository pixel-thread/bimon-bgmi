"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PlusIcon, XIcon, SaveIcon, AlertCircle, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { TeamT } from "@/src/types/team";
import { usePlayers } from "@/src/hooks/player/usePlayers";
import React from "react";
import { toast } from "sonner";
import { useTournamentStore } from "@/src/store/tournament";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { LoaderFive } from "../../ui/loader";
import { Ternary } from "../../common/Ternary";
import { SearchPlayerDialog } from "../player/SearchPlayerDialog";
import { useTournament } from "@/src/hooks/tournament/useTournament";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

type AddPlayerToTeamDialogProps = {
  open?: boolean;
  onOpenChange?: () => void;
  teamId: string;
};

export const AddPlayerToTeamDialog = ({
  open,
  onOpenChange,
  teamId,
}: AddPlayerToTeamDialogProps) => {
  const queryClient = useQueryClient();
  const [searchDialogOpen, setSearchDialogOpen] = React.useState(false);
  const { matchId } = useMatchStore();
  // Local state for pending changes
  const [playersList, setPlayersList] = React.useState<string[]>([]);
  const [originalPlayersList, setOriginalPlayersList] = React.useState<string[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);

  // UC deduction confirmation state
  const [pendingPlayer, setPendingPlayer] = React.useState<{ id: string; name: string } | null>(null);
  const [showUCConfirm, setShowUCConfirm] = React.useState(false);
  // Track players to add with UC deduction
  const [playersWithUCDeduction, setPlayersWithUCDeduction] = React.useState<Set<string>>(new Set());

  // Move confirmation state
  const [showMoveConfirm, setShowMoveConfirm] = React.useState(false);
  const [playerToMove, setPlayerToMove] = React.useState<{
    id: string;
    name: string;
    currentTeamId: string;
    currentTeamName: string;
  } | null>(null);
  // Track players that need to be moved from other teams (playerId -> {teamId, teamName})
  const [playersToMoveFrom, setPlayersToMoveFrom] = React.useState<Map<string, { teamId: string; teamName: string }>>(new Map());

  const { data: team, isFetching } = useQuery({
    queryKey: ["team", teamId],
    queryFn: () =>
      http.get<TeamT>(
        ADMIN_TEAM_ENDPOINTS.GET_TEAM_BY_ID.replace(":teamId", teamId),
      ),
    select: (data) => data.data,
    enabled: open,
  });

  const { data: players, isFetching: isFetchingPlayers } = usePlayers();

  const { tournamentId } = useTournamentStore();
  const { data: tournament } = useTournament({ id: tournamentId });
  const entryFee = tournament?.fee || 0;

  const { mutateAsync: addPlayer, isPending: isAdding } = useMutation({
    mutationFn: (data: { playerId: string; matchId: string; deductUC?: boolean; moveFromTeamId?: string }) =>
      http.post<{ id: string }>(
        ADMIN_TEAM_ENDPOINTS.POST_ADD_PLAYER_TO_TEAM.replace(":teamId", teamId),
        data,
      ),
  });

  const { mutateAsync: removePlayer, isPending: isRemoving } = useMutation({
    mutationFn: (data: { playerId: string; matchId: string }) =>
      http.post<{ id: string }>(
        ADMIN_TEAM_ENDPOINTS.POST_REMOVE_PLAYER_FROM_TEAM.replace(
          ":teamId",
          teamId,
        ),
        data,
      ),
  });

  const isSaving = isAdding || isRemoving;

  // Pre-fill fields with existing players once the team data loads
  React.useEffect(() => {
    if (team?.players) {
      const playerIds = team.players.map((p) => p.id);
      setPlayersList(playerIds);
      setOriginalPlayersList(playerIds);
      setHasChanges(false);
      setPlayersWithUCDeduction(new Set());
      setPlayersToMoveFrom(new Map());
    }
  }, [team]);

  // Check for changes whenever playersList updates
  React.useEffect(() => {
    const playersChanged =
      playersList.length !== originalPlayersList.length ||
      playersList.some((id) => !originalPlayersList.includes(id)) ||
      originalPlayersList.some((id) => !playersList.includes(id));
    setHasChanges(playersChanged);
  }, [playersList, originalPlayersList]);

  /** Insert selected player from dialog - checks if UC deduction is needed or if player needs to be moved */
  const handleInsertPlayer = (
    playerId: string,
    playerName: string,
    teamInfo: { teamId: string; teamName: string } | null
  ) => {
    setSearchDialogOpen(false);

    if (playersList.includes(playerId)) return;

    // If player is already on another team, ask to move
    if (teamInfo && teamInfo.teamId !== teamId) {
      setPlayerToMove({
        id: playerId,
        name: playerName,
        currentTeamId: teamInfo.teamId,
        currentTeamName: teamInfo.teamName,
      });
      setShowMoveConfirm(true);
      return;
    }

    // If tournament has entry fee, ask about UC deduction
    if (entryFee > 0) {
      setPendingPlayer({ id: playerId, name: playerName });
      setShowUCConfirm(true);
    } else {
      // No entry fee, just add
      setPlayersList((prev) => [...prev, playerId]);
    }
  };

  /** Handle UC confirmation response */
  const handleUCConfirmResponse = (deductUC: boolean) => {
    if (pendingPlayer) {
      setPlayersList((prev) => [...prev, pendingPlayer.id]);
      if (deductUC) {
        setPlayersWithUCDeduction(prev => new Set(prev).add(pendingPlayer.id));
      }
    }
    setPendingPlayer(null);
    setShowUCConfirm(false);
  };

  /** Handle move confirmation response */
  const handleMoveConfirmResponse = (shouldMove: boolean) => {
    if (playerToMove && shouldMove) {
      setPlayersList((prev) => [...prev, playerToMove.id]);
      setPlayersToMoveFrom(prev => new Map(prev).set(playerToMove.id, {
        teamId: playerToMove.currentTeamId,
        teamName: playerToMove.currentTeamName,
      }));
    }
    setPlayerToMove(null);
    setShowMoveConfirm(false);
  };

  /** Remove player locally */
  const handleRemovePlayer = (playerId: string) => {
    setPlayersList((list) => list.filter((id) => id !== playerId));
    setPlayersWithUCDeduction(prev => {
      const next = new Set(prev);
      next.delete(playerId);
      return next;
    });
  };

  /** Replace player in select field (local only) */
  const handleReplacePlayer = (index: number, newPlayerId: string) => {
    const oldPlayerId = playersList[index];
    const updated = [...playersList];
    updated[index] = newPlayerId;
    setPlayersList(updated);

    // Transfer UC deduction status if applicable
    if (playersWithUCDeduction.has(oldPlayerId)) {
      setPlayersWithUCDeduction(prev => {
        const next = new Set(prev);
        next.delete(oldPlayerId);
        next.add(newPlayerId);
        return next;
      });
    }
  };

  /** Save all changes */
  const handleSaveChanges = async () => {
    // Find players to add (in current list but not in original)
    const playersToAdd = playersList.filter(
      (id) => !originalPlayersList.includes(id)
    );
    // Find players to remove (in original list but not in current)
    const playersToRemove = originalPlayersList.filter(
      (id) => !playersList.includes(id)
    );

    let hasError = false;

    // Process removals first
    for (const playerId of playersToRemove) {
      const result = await removePlayer({ playerId, matchId });
      if (!result.success) {
        toast.error(result.message || `Failed to remove player`);
        hasError = true;
      }
    }

    // Then process additions with UC deduction flag and move info
    for (const playerId of playersToAdd) {
      const deductUC = playersWithUCDeduction.has(playerId);
      const moveInfo = playersToMoveFrom.get(playerId);
      const moveFromTeamId = moveInfo?.teamId;
      const result = await addPlayer({ playerId, matchId, deductUC, moveFromTeamId });
      if (!result.success) {
        toast.error(result.message || `Failed to add player`);
        hasError = true;
      }
    }

    if (!hasError) {
      // Build informative message
      const movedPlayers = Array.from(playersToMoveFrom.entries());
      if (movedPlayers.length > 0) {
        const playerNames = movedPlayers.map(([id]) => {
          const player = players?.find(p => p.id === id);
          return player?.userName || 'Player';
        });
        const fromTeams = movedPlayers.map(([, info]) => info.teamName);
        const moveDetails = playerNames.map((name, i) => `${name} moved from ${fromTeams[i]}`).join(", ");
        toast.success(`Team updated. ${moveDetails}`);
      } else {
        toast.success("Team updated successfully");
      }
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    queryClient.invalidateQueries({
      queryKey: ["teams", tournamentId, matchId],
    });
    queryClient.invalidateQueries({
      queryKey: ["teams", tournamentId],
    });

    // Update original list to reflect saved state
    setOriginalPlayersList([...playersList]);
    setHasChanges(false);
    setPlayersWithUCDeduction(new Set());
    setPlayersToMoveFrom(new Map());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]! w-full">
        <DialogHeader>
          <DialogTitle>Update Team</DialogTitle>
          <DialogDescription>
            Add or remove players, then click Save to apply all changes at once.
            {entryFee > 0 && (
              <span className="block mt-1 text-orange-500">
                Entry Fee: {entryFee} UC per player
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search Player Dialog */}
        <SearchPlayerDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          onSelectPlayer={handleInsertPlayer}
          tournamentId={tournamentId}
        />

        {/* UC Deduction Confirmation Dialog */}
        <AlertDialog open={showUCConfirm} onOpenChange={setShowUCConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Deduct Entry Fee?
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{pendingPlayer?.name}</strong> will be added to the team.
                <br /><br />
                Do you want to deduct <strong className="text-orange-500">{entryFee} UC</strong> as entry fee?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleUCConfirmResponse(false)}>
                Add without deduction
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleUCConfirmResponse(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Deduct {entryFee} UC
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Move Player Confirmation Dialog */}
        <AlertDialog open={showMoveConfirm} onOpenChange={setShowMoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-blue-500" />
                Move Player?
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{playerToMove?.name}</strong> is currently on <strong className="text-blue-500">{playerToMove?.currentTeamName}</strong>.
                <br /><br />
                Do you want to move this player to this team?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => handleMoveConfirmResponse(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleMoveConfirmResponse(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Move Player
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Ternary
          condition={isFetchingPlayers || isFetching}
          trueComponent={
            <div className="py-10 flex items-center justify-center">
              <LoaderFive text="Loading..." />
            </div>
          }
          falseComponent={
            <div className="flex flex-col space-y-4 mt-3">
              {playersList.map((playerId, index) => {
                const isNewWithUC = !originalPlayersList.includes(playerId) && playersWithUCDeduction.has(playerId);
                const moveFromInfo = playersToMoveFrom.get(playerId);
                const isBeingMoved = !originalPlayersList.includes(playerId) && !!moveFromInfo;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">Player {index + 1}</p>
                      {isNewWithUC && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded dark:bg-orange-900 dark:text-orange-300">
                          -{entryFee} UC
                        </span>
                      )}
                      {isBeingMoved && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                          Moving from {moveFromInfo.teamName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={playerId}
                        onValueChange={(value) => handleReplacePlayer(index, value)}
                        disabled={isFetchingPlayers || isSaving}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {players?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.userName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="destructive"
                        size="icon"
                        disabled={isSaving}
                        onClick={() => handleRemovePlayer(playerId)}
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearchDialogOpen(true)}
                  disabled={isSaving}
                  className="self-start flex-1"
                >
                  <PlusIcon className="mr-2 w-4 h-4" /> Add Player
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={!hasChanges || isSaving}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <SaveIcon className="mr-2 w-4 h-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
};
