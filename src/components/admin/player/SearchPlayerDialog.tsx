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
import { RefreshCwIcon, Users } from "lucide-react";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { TeamT } from "@/src/types/team";

type PlayerTeamInfo = {
  teamId: string;
  teamName: string;
} | null;

export const SearchPlayerDialog = ({
  open,
  onOpenChange,
  onSelectPlayer,
  tournamentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectPlayer: (playerId: string, playerName: string, teamInfo: PlayerTeamInfo) => void;
  tournamentId?: string;
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

  // Fetch teams for this tournament to show which players are already on teams
  const teamsUrl = tournamentId
    ? ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID
      .replace(":id", tournamentId)
      .replace(":matchId", "all")
      .replace(":page", "all")
    : "";

  const { data: teamsResponse } = useQuery({
    queryKey: ["teams", tournamentId, "all", "all", "search-dialog"],
    queryFn: () => http.get<TeamT[]>(teamsUrl),
    enabled: open && !!tournamentId,
    staleTime: 60 * 1000,
  });

  const teams = teamsResponse?.data || [];

  // Create a map of playerId -> team info for quick lookup
  const playerTeamMap = React.useMemo(() => {
    const map = new Map<string, { teamId: string; teamName: string }>();
    teams.forEach((team) => {
      team.players?.forEach((player) => {
        map.set(player.id, { teamId: team.id, teamName: team.name });
      });
    });
    return map;
  }, [teams]);

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

  const handleSelectPlayer = (player: PlayerT) => {
    const teamInfo = playerTeamMap.get(player.id) || null;
    onSelectPlayer(player.id, player.user.userName, teamInfo);
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
              filteredPlayers.map((player) => {
                const teamInfo = playerTeamMap.get(player.id);
                return (
                  <CommandItem
                    key={player.id}
                    value={player.id}
                    onSelect={() => handleSelectPlayer(player)}
                    className="flex items-center justify-between"
                  >
                    <span>{player.user.userName}</span>
                    {teamInfo && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        <Users className="h-3 w-3" />
                        {teamInfo.teamName}
                      </span>
                    )}
                  </CommandItem>
                );
              })
            )}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
};
