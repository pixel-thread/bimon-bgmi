"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { usePlayers } from "@/src/hooks/player/usePlayers";
import React from "react";
import { toast } from "sonner";
import { useTournamentStore } from "@/src/store/tournament";
import { useRouter } from "next/navigation";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { PlayerT } from "@/src/types/player";
import { Ternary } from "../../common/Ternary";
import { LoaderFive } from "../../ui/loader";
import { Input } from "../../ui/input";

type AddPlayerToTeamDialogProps = {
  open?: boolean;
  onOpenChange: () => void;
};

export const CreateTeamDialog = ({
  open,
  onOpenChange,
}: AddPlayerToTeamDialogProps) => {
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [playersList, setPlayersList] = React.useState<string[]>([]);
  const [searchDialogOpen, setSearchDialogOpen] = React.useState(false);

  const { data: players, isFetching: isFetchingPlayers } = usePlayers({
    page: "all",
  });

  const payload = {
    tournamentId,
    matchId,
    players: playersList.map((id) => ({ playerId: id })),
  };

  const { mutate: createTeam, isPending } = useMutation({
    mutationFn: () =>
      http.post<{ id: string }>(
        ADMIN_TEAM_ENDPOINTS.POST_CREATE_TEAM_BY_TOURNAMENT_ID,
        payload,
      ),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message);
        queryClient.invalidateQueries({
          queryKey: ["team", tournamentId, matchId],
        });
        router.push(`?update=${res?.data?.id}`);
        onOpenChange();
      } else toast.error(res.message);
    },
  });

  /** Insert selected player from dialog */
  const handleInsertPlayer = (playerId: string) => {
    if (!playersList.includes(playerId)) {
      setPlayersList((prev) => [...prev, playerId]);
    }
    setSearchDialogOpen(false);
  };

  /** Change player in select field */
  const handlePlayerChange = (index: number, value: string) => {
    const updated = [...playersList];
    updated[index] = value;
    setPlayersList(updated);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayersList((list) => list.filter((playerId) => playerId !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] w-full">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>Add players to form a new team.</DialogDescription>
        </DialogHeader>

        {/* Search Player Dialog */}
        <SearchPlayer
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          onSelectPlayer={handleInsertPlayer}
        />

        <div className="flex flex-col space-y-4 mt-3">
          {playersList.map((playerId, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm font-medium">Player {index + 1}</p>

              <div className="flex items-center gap-2">
                <Select
                  value={playerId}
                  onValueChange={(value) => handlePlayerChange(index, value)}
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
                  onClick={() => handleRemovePlayer(playerId)}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => setSearchDialogOpen(true)}
            disabled={isPending}
            className="self-start"
          >
            <PlusIcon className="mr-2 w-4 h-4" /> Add Player
          </Button>

          <Button
            onClick={() => createTeam()}
            disabled={playersList.length === 0 || isPending}
            className="w-full"
          >
            {isPending ? "Creating..." : "Create Team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const SearchPlayer = ({
  open,
  onOpenChange,
  onSelectPlayer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectPlayer: (playerId: string) => void;
}) => {
  const [value, setValue] = React.useState("");

  const { data: players, isFetching } = useQuery({
    queryKey: ["search-player", value],
    queryFn: () => http.post<PlayerT[]>(`/players/search`, { query: value }),
    select: (data) => data.data,
  });

  const onClose = () => {
    setValue("");
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onClose}>
      <Command className="rounded-lg border shadow-md md:min-w-[450px]">
        <Input
          value={value}
          placeholder="Search player..."
          onChange={(e) => setValue(e.target.value)}
        />
        <CommandList>
          <CommandGroup>
            <Ternary
              condition={isFetching}
              trueComponent={
                <CommandItem disabled>
                  <LoaderFive text="Searching" />
                </CommandItem>
              }
              falseComponent={
                <>
                  <CommandEmpty>No players found.</CommandEmpty>
                  {players?.map((player) => (
                    <CommandItem
                      key={player.id}
                      value={player.id}
                      onSelect={() => onSelectPlayer(player.id)}
                    >
                      {player.user.userName}
                    </CommandItem>
                  ))}
                </>
              }
            />
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
