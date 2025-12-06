"use client";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";

import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import React from "react";
import { PlayerT } from "@/src/types/player";
import { LoaderFive } from "../../ui/loader";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { RefreshCwIcon } from "lucide-react";

export const SearchPlayerDialog = ({
  open,
  onOpenChange,
  onSelectPlayer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectPlayer: (playerId: string, playerName: string) => void;
}) => {
  const [value, setValue] = React.useState("");

  // Preload all players once and cache for 10 minutes
  const { data: allPlayers, isFetching: isLoadingPlayers, refetch } = useQuery({
    queryKey: ["all-players-search"],
    queryFn: () => http.post<PlayerT[]>(`/players/search`, { query: "" }),
    select: (data) => data.data,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filter players locally based on search value
  const filteredPlayers = React.useMemo(() => {
    if (!allPlayers) return [];
    if (!value.trim()) return allPlayers;

    const searchLower = value.toLowerCase().trim();
    return allPlayers.filter((player) =>
      player.user.userName.toLowerCase().includes(searchLower)
    );
  }, [allPlayers, value]);

  const onClose = () => {
    setValue("");
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onClose}>
      <Command className="rounded-lg border shadow-md md:min-w-[450px]">
        <div className="flex items-center gap-2 p-2 border-b">
          <Input
            value={value}
            placeholder="Search player..."
            onChange={(e) => setValue(e.target.value)}
            autoFocus
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoadingPlayers}
            title="Refresh player list"
            className="shrink-0"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isLoadingPlayers ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CommandList>
          <CommandGroup>
            {isLoadingPlayers && !allPlayers ? (
              <CommandItem disabled>
                <LoaderFive text="Loading players" />
              </CommandItem>
            ) : filteredPlayers.length === 0 ? (
              <CommandEmpty>No players found.</CommandEmpty>
            ) : (
              filteredPlayers.map((player) => (
                <CommandItem
                  key={player.id}
                  value={player.id}
                  onSelect={() => onSelectPlayer(player.id, player.user.userName)}
                >
                  {player.user.userName}
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
