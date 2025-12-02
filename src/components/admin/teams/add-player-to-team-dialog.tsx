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
import { PlusIcon, XIcon } from "lucide-react";
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
  const [playersList, setPlayersList] = React.useState<string[]>([]);
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

  const { mutate: addPlayer, isPending } = useMutation({
    mutationFn: (data: { playerId: string; matchId: string }) =>
      http.post<{ id: string }>(
        ADMIN_TEAM_ENDPOINTS.POST_ADD_PLAYER_TO_TEAM.replace(":teamId", teamId),
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["team", teamId] });
        queryClient.invalidateQueries({
          queryKey: ["team", tournamentId, matchId],
        });

        queryClient.invalidateQueries({
          queryKey: ["team", tournamentId],
        });
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const { mutate: removePlayer, isPending: isRemoving } = useMutation({
    mutationFn: (data: { playerId: string; matchId: string }) =>
      http.post<{ id: string }>(
        ADMIN_TEAM_ENDPOINTS.POST_REMOVE_PLAYER_FROM_TEAM.replace(
          ":teamId",
          teamId,
        ),
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["team", teamId] });
        queryClient.invalidateQueries({
          queryKey: ["team", tournamentId],
        });
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  // Pre-fill fields with existing players once the team data loads
  React.useEffect(() => {
    if (team?.players) {
      setPlayersList(team.players.map((p) => p.id));
    }
  }, [team]);

  /** Insert selected player from dialog */
  const handleInsertPlayer = (playerId: string) => {
    if (!playersList.includes(playerId)) {
      addPlayer({ playerId: playerId, matchId: matchId });
    }
    setSearchDialogOpen(false);
  };

  const handleRemovePlayer = (playerId: string) => {
    removePlayer({ playerId, matchId });
  };

  const handleReplacePlayer = (playerId: string) => {
    addPlayer({ playerId: playerId, matchId: matchId });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]! w-full">
        <DialogHeader>
          <DialogTitle>Update Team</DialogTitle>
          <DialogDescription>
            Existing players are preloaded. Use the plus icon to add new ones.
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
                      onValueChange={(value) => handleReplacePlayer(value)}
                      disabled={isFetchingPlayers || isPending}
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
                      disabled={isRemoving}
                      onClick={() => handleRemovePlayer(playerId)}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 ">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSearchDialogOpen(true)}
                  disabled={isPending}
                  className="self-start w-full"
                >
                  <PlusIcon className="mr-2 w-4 h-4" /> Add Player
                </Button>
              </div>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
};
