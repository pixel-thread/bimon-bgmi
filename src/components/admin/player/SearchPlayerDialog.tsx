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
import { Ternary } from "../../common/Ternary";
import { LoaderFive } from "../../ui/loader";
import { Input } from "../../ui/input";
export const SearchPlayerDialog = ({
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
