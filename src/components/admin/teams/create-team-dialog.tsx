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
import { PlusIcon, XIcon, CreditCardIcon, SkipForwardIcon } from "lucide-react";
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

type AddPlayerToTeamDialogProps = {
  open?: boolean;
  onOpenChange: (wasCreated?: boolean) => void;
};

// Store both id and name to avoid lookup issues
type PlayerEntry = {
  id: string;
  name: string;
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

  const { data: tournament } = useTournament({ id: tournamentId });
  const entryFee = tournament?.fee || 0;

  const { mutate: createTeam, isPending } = useMutation({
    mutationFn: (deductUC: boolean) =>
      http.post<CreateTeamResponse>(
        ADMIN_TEAM_ENDPOINTS.POST_CREATE_TEAM_BY_TOURNAMENT_ID,
        {
          tournamentId,
          matchId,
          players: playersList.map((p) => ({ playerId: p.id })),
          deductUC,
        },
      ),
    onSuccess: (res) => {
      if (res.success && res.data) {
        toast.success(res.message);

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

  /** Insert selected player from dialog */
  const handleInsertPlayer = (playerId: string, playerName: string) => {
    if (!playersList.some((p) => p.id === playerId)) {
      setPlayersList((prev) => [...prev, { id: playerId, name: playerName }]);
    }
    setSearchDialogOpen(false);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayersList((list) => list.filter((p) => p.id !== id));
  };

  // Close without creating - no refetch needed
  const onClose = () => {
    setSearchDialogOpen(false);
    setPlayersList([]);
    setShowConfirmation(false);
    onOpenChange(false);
  };

  // Close after successful creation - no refetch, just close
  const handleCloseAfterCreate = () => {
    setSearchDialogOpen(false);
    setPlayersList([]);
    setShowConfirmation(false);
    onOpenChange(false); // Pass false since we already updated cache
  };

  const handleCreateClick = () => {
    if (entryFee > 0) {
      // Show confirmation dialog if tournament has entry fee
      setShowConfirmation(true);
    } else {
      // No entry fee, just create team without deduction
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
          />

          <div className="flex flex-col space-y-3 mt-3">
            {/* Display selected players as simple badges/chips */}
            {playersList.length > 0 && (
              <div className="space-y-2">
                {playersList.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium">{player.name}</span>
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
