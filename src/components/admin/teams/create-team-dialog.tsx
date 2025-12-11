"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { PlusIcon, XIcon, CreditCardIcon, SkipForwardIcon, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import React from "react";
import { toast } from "sonner";
import { useTournamentStore } from "@/src/store/tournament";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { SearchPlayerDialog } from "../player/SearchPlayerDialog";
import { useTournament } from "@/src/hooks/tournament/useTournament";
import { TeamT } from "@/src/types/team";
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
  onOpenChange: (wasCreated?: boolean) => void;
};

// Store both id and name to avoid lookup issues
type PlayerEntry = {
  id: string;
  name: string;
  moveFromTeamId?: string;
  moveFromTeamName?: string;
};

// API response type for team creation
type CreateTeamResponse = {
  id: string;
  name: string;
  teamNumber: number;
};

export const CreateTeamDialog = ({
  open,
  onOpenChange,
}: AddPlayerToTeamDialogProps) => {
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();
  const queryClient = useQueryClient();

  const [playersList, setPlayersList] = React.useState<PlayerEntry[]>([]);
  const [searchDialogOpen, setSearchDialogOpen] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  // Move confirmation state
  const [showMoveConfirm, setShowMoveConfirm] = React.useState(false);
  const [playerToMove, setPlayerToMove] = React.useState<{
    id: string;
    name: string;
    currentTeamId: string;
    currentTeamName: string;
  } | null>(null);

  const { data: tournament } = useTournament({ id: tournamentId });
  const entryFee = tournament?.fee || 0;

  const { mutate: createTeam, isPending } = useMutation({
    mutationFn: (deductUC: boolean) =>
      http.post<CreateTeamResponse>(
        ADMIN_TEAM_ENDPOINTS.POST_CREATE_TEAM_BY_TOURNAMENT_ID,
        {
          tournamentId,
          matchId,
          players: playersList.map((p) => ({
            playerId: p.id,
            moveFromTeamId: p.moveFromTeamId,
          })),
          deductUC,
        },
      ),
    onSuccess: (res) => {
      if (res.success && res.data) {
        // Build informative message
        const movedPlayers = playersList.filter(p => p.moveFromTeamName);
        let message = res.message;
        if (movedPlayers.length > 0) {
          const moveInfo = movedPlayers.map(p => `${p.name} moved from ${p.moveFromTeamName}`).join(", ");
          message += `. ${moveInfo}`;
        }
        toast.success(message);

        // Add the new team to the cache directly instead of refetching
        const newTeam: Partial<TeamT> = {
          id: res.data.id,
          name: res.data.name,
          size: playersList.length,
          slotNo: res.data.teamNumber,
          players: playersList.map((p) => ({
            id: p.id,
            name: p.name,
            category: 0,
          })),
          position: 0,
          kills: 0,
          deaths: 0,
          pts: 0,
          total: 0,
          teamPlayerStats: [],
        };

        // Update the cache with the new team
        queryClient.setQueryData(
          ["teams", tournamentId, matchId, "all"],
          (oldData: { data: TeamT[]; meta?: unknown } | undefined) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: [...(oldData.data || []), newTeam as TeamT],
            };
          }
        );

        // Close without triggering refetch
        handleCloseAfterCreate();
      } else {
        toast.error(res.message);
      }
    },
  });

  /** Insert selected player from dialog - handles move detection */
  const handleInsertPlayer = (
    playerId: string,
    playerName: string,
    teamInfo: { teamId: string; teamName: string } | null
  ) => {
    setSearchDialogOpen(false);

    if (playersList.some((p) => p.id === playerId)) return;

    // If player is already on another team, ask to move
    if (teamInfo) {
      setPlayerToMove({
        id: playerId,
        name: playerName,
        currentTeamId: teamInfo.teamId,
        currentTeamName: teamInfo.teamName,
      });
      setShowMoveConfirm(true);
      return;
    }

    // Regular add
    setPlayersList((prev) => [...prev, { id: playerId, name: playerName }]);
  };

  /** Handle move confirmation response */
  const handleMoveConfirmResponse = (shouldMove: boolean) => {
    if (playerToMove && shouldMove) {
      setPlayersList((prev) => [...prev, {
        id: playerToMove.id,
        name: playerToMove.name,
        moveFromTeamId: playerToMove.currentTeamId,
        moveFromTeamName: playerToMove.currentTeamName,
      }]);
    }
    setPlayerToMove(null);
    setShowMoveConfirm(false);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayersList((list) => list.filter((p) => p.id !== id));
  };

  // Close without creating - no refetch needed
  const onClose = () => {
    setSearchDialogOpen(false);
    setPlayersList([]);
    setShowConfirmation(false);
    setShowMoveConfirm(false);
    setPlayerToMove(null);
    onOpenChange(false);
  };

  // Close after successful creation - no refetch, just close
  const handleCloseAfterCreate = () => {
    setSearchDialogOpen(false);
    setPlayersList([]);
    setShowConfirmation(false);
    setShowMoveConfirm(false);
    setPlayerToMove(null);
    onOpenChange(false); // Pass false since we already updated cache
  };

  const handleCreateClick = () => {
    // Check if any players are being moved (they've already paid UC)
    const hasMovedPlayers = playersList.some(p => p.moveFromTeamId);
    const newPlayers = playersList.filter(p => !p.moveFromTeamId);

    if (entryFee > 0 && newPlayers.length > 0) {
      // Show confirmation dialog if tournament has entry fee and there are new players
      setShowConfirmation(true);
    } else {
      // No entry fee or all players are being moved, just create team without deduction
      createTeam(false);
    }
  };

  const handleConfirmWithDeduction = () => {
    setShowConfirmation(false);
    createTeam(true);
  };

  const handleConfirmWithoutDeduction = () => {
    setShowConfirmation(false);
    createTeam(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[420px]! w-full">
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Add players to form a new team.
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
                  Do you want to move this player to the new team?
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

          <div className="flex flex-col space-y-3 mt-3">
            {/* Display selected players as simple badges/chips */}
            {playersList.length > 0 && (
              <div className="space-y-2">
                {playersList.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium">{player.name}</span>
                      {player.moveFromTeamName && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                          Moving from {player.moveFromTeamName}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemovePlayer(player.id)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchDialogOpen(true)}
                disabled={isPending}
                className="self-start w-auto"
              >
                <PlusIcon className="mr-2 w-4 h-4" /> Add Player
              </Button>

              <div className="w-full">
                <Button
                  onClick={handleCreateClick}
                  disabled={playersList.length === 0 || isPending}
                  className="w-full"
                >
                  {isPending ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UC Deduction Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Deduct Entry Fee?</DialogTitle>
            <DialogDescription>
              This tournament has an entry fee of{" "}
              <span className="font-semibold text-orange-500">{entryFee} UC</span>.
              <br />
              Would you like to deduct it from each player?
              {playersList.some(p => p.moveFromTeamId) && (
                <span className="block mt-2 text-sm text-muted-foreground">
                  Note: Players being moved have already paid.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleConfirmWithoutDeduction}
              disabled={isPending}
              className="flex-1"
            >
              <SkipForwardIcon className="mr-2 w-4 h-4" />
              Skip Deduction
            </Button>
            <Button
              onClick={handleConfirmWithDeduction}
              disabled={isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CreditCardIcon className="mr-2 w-4 h-4" />
              Deduct {entryFee} UC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
