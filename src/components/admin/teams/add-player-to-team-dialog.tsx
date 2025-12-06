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
import { PlusIcon, XIcon, SaveIcon } from "lucide-react";
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

  const { mutateAsync: addPlayer, isPending: isAdding } = useMutation({
    mutationFn: (data: { playerId: string; matchId: string }) =>
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

  /** Insert selected player from dialog (local only) */
  const handleInsertPlayer = (playerId: string) => {
    if (!playersList.includes(playerId)) {
      setPlayersList((prev) => [...prev, playerId]);
    }
    setSearchDialogOpen(false);
  };

  /** Remove player locally */
  const handleRemovePlayer = (playerId: string) => {
    setPlayersList((list) => list.filter((id) => id !== playerId));
  };

  /** Replace player in select field (local only) */
  const handleReplacePlayer = (index: number, newPlayerId: string) => {
    const updated = [...playersList];
    updated[index] = newPlayerId;
    setPlayersList(updated);
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

    // Then process additions
    for (const playerId of playersToAdd) {
      const result = await addPlayer({ playerId, matchId });
      if (!result.success) {
        toast.error(result.message || `Failed to add player`);
        hasError = true;
      }
    }

    if (!hasError) {
      toast.success("Team updated successfully");
    }

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["team", teamId] });
    queryClient.invalidateQueries({
      queryKey: ["team", tournamentId, matchId],
    });
    queryClient.invalidateQueries({
      queryKey: ["team", tournamentId],
    });

    // Update original list to reflect saved state
    setOriginalPlayersList([...playersList]);
    setHasChanges(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]! w-full">
        <DialogHeader>
          <DialogTitle>Update Team</DialogTitle>
          <DialogDescription>
            Add or remove players, then click Save to apply all changes at once.
          </DialogDescription>
        </DialogHeader>

        {/* Search Player Dialog */}
        <SearchPlayerDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          onSelectPlayer={handleInsertPlayer}
        />

        <Ternary
          condition={isFetchingPlayers || isFetching}
          trueComponent={
            <div className="py-10 flex items-center justify-center">
              <LoaderFive text="Loading..." />
            </div>
          }
          falseComponent={
            <div className="flex flex-col space-y-4 mt-3">
              {playersList.map((playerId, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm font-medium">Player {index + 1}</p>

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
              ))}

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
