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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { usePlayers } from "@/src/hooks/player/usePlayers";
import React from "react";
import { toast } from "sonner";
import { useTournamentStore } from "@/src/store/tournament";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/src/store/match/useMatchStore";

type AddPlayerToTeamDialogProps = {
  open?: boolean;
  onOpenChange: () => void;
};

export const CreateTeamDialog = ({
  open,
  onOpenChange,
}: AddPlayerToTeamDialogProps) => {
  const { tournamentId } = useTournamentStore();
  const router = useRouter();
  const { matchId } = useMatchStore();
  const queryClient = useQueryClient();

  const [playersList, setPlayersList] = React.useState<string[]>([]);

  const { data: players, isFetching: isFetchingPlayers } = usePlayers();

  const payload = {
    tournamentId: tournamentId,
    matchId: matchId,
    players: playersList.map((player) => {
      return {
        playerId: player,
      };
    }),
  };

  const { mutate: addPlayer, isPending } = useMutation({
    mutationFn: () =>
      http.post<{ id: string }>(
        ADMIN_TEAM_ENDPOINTS.POST_CREATE_TEAM_BY_TOURNAMENT_ID,
        payload,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["team", tournamentId] });
        router.push(`?update=${data?.data?.id}`);
        onOpenChange();
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  // Pre-fill fields with existing players once the team data loads
  const handlePlayerChange = (index: number, value: string) => {
    const newList = [...playersList];
    newList[index] = value;
    setPlayersList(newList);
    addPlayer();
  };

  const handleRemovePlayer = (playerId: string) => {
    const newList = playersList.filter((id) => id !== playerId);
    setPlayersList(newList);
  };

  const handleAddField = () => {
    setPlayersList((prev) => [...prev, ""]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] w-full">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Existing players are preloaded. Use the plus icon to add new ones.
          </DialogDescription>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
};
