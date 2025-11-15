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

  const handlePlayerChange = (index: number, value: string) => {
    const newList = [...playersList];
    newList[index] = value;
    setPlayersList(newList);
    addPlayer({ playerId: value, matchId: matchId });
  };

  const handleAddField = () => {
    setPlayersList((prev) => [...prev, ""]);
  };

  const handleRemovePlayer = (playerId: string) => {
    removePlayer({ playerId, matchId });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] w-full">
        <DialogHeader>
          <DialogTitle>Add Players to Team</DialogTitle>
          <DialogDescription>
            Existing players are preloaded. Use the plus icon to add new ones.
          </DialogDescription>
        </DialogHeader>

        <Ternary
          condition={isFetchingPlayers || isFetching}
          trueComponent={
            <div className="py-10">
              <LoaderFive text="Loading..." />
            </div>
          }
          falseComponent={
            <div className="flex flex-col space-y-3">
              {playersList.map((playerId, index) => (
                <div key={index}>
                  <p className="text-sm font-medium mb-1">Player {index + 1}</p>
                  <Select
                    onValueChange={(value) => handlePlayerChange(index, value)}
                    value={playerId}
                    disabled={isFetchingPlayers || isPending}
                  >
                    <div className="flex items-center space-x-2">
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <Button
                        type="button"
                        variant="destructive"
                        size={"icon-lg"}
                        disabled={isRemoving}
                        onClick={() => handleRemovePlayer(playerId)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <SelectContent>
                      {players?.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.userName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <Button
                type="button"
                onClick={handleAddField}
                variant="outline"
                className="w-fit"
              >
                <PlusIcon className="mr-2 h-4 w-4" /> Add Player Field
              </Button>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  );
};
