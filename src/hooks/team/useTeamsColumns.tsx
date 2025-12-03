import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { toast } from "sonner";
import { MoreVertical, SaveIcon } from "lucide-react";
import { useTournamentStore } from "@/src/store/tournament";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import React, { useState } from "react";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { Input } from "@/src/components/ui/input";
import { TeamPlayerStats } from "@/src/lib/db/prisma/generated/prisma";
import { TeamStatsForm } from "@/src/utils/validation/team/team-stats";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/src/components/ui/form";
import { debounce } from "@/src/utils/debounce";
import { Ternary } from "@/src/components/common/Ternary";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = {
  page?: string;
};

export const useTeamsColumns = ({ page }: Props = { page: "1" }) => {
  const columns: ColumnDef<TeamT>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Team Name",
        cell: ({ row }) => (
          <Link href={`?teamStats=${row.original.id}`}>
            {row.original.name}
          </Link>
        ),
      },
      {
        header: "Kill",
        cell: ({ row }) => (
          <UpdateTeamPlayerStats
            teamPlayerStats={row.original.teamPlayerStats}
          />
        ),
      },
      {
        header: "Position",
        cell: ({ row }) => (
          <UpdateTeamStatsPosition
            teamId={row.original.id}
            position={row.original.position}
          />
        ),
      },
      {
        header: "Action",
        cell: ({ row }) => <ActionDropdown page={page} id={row.original.id} />,
      },
    ],
    [],
  );

  return { columns };
};

const ActionDropdown = ({ id, page }: { id: string; page?: string }) => {
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();
  const queryClient = useQueryClient();

  const { mutate: deleteTeam, isPending: isDeletingTeam } = useMutation({
    mutationFn: (id: string) =>
      http.delete(
        ADMIN_TEAM_ENDPOINTS.DELETE_TEAM_BY_ID.replace(":teamId", id),
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: ["team", tournamentId, matchId, page],
        });
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={"icon-sm"} variant="ghost">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/admin/teams?teamStats=${id}`}>Team Stats</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/admin/teams?update=${id}`}>Update Team</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isDeletingTeam || !tournamentId || !id}
            onClick={() => deleteTeam(id)}
          >
            Delete Team
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UpdateTeamPlayerStats = ({
  teamPlayerStats,
}: {
  teamPlayerStats: TeamPlayerStats[];
}) => {
  const teamId = teamPlayerStats ? teamPlayerStats[0]?.teamId : "";
  const [value, setValue] = useState<{
    kills: number;
    playerId: string;
  }>({
    kills: 0,
    playerId: "",
  });

  const { matchId } = useMatchStore();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: TeamStatsForm) =>
      http.put<TeamStatsForm>(
        ADMIN_TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", teamId),
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const onSubmit = () => {
    const payload: TeamStatsForm & { matchId: string } = {
      teamId: teamId,
      matchId: matchId,
      players: [
        {
          playerId: value?.playerId,
          kills: value?.kills,
          deaths: 1,
        },
      ],
    };
    mutate(payload);
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <div className="flex gap-2 items-center max-w-full justify-between flex-row">
        <Ternary
          condition={teamPlayerStats && teamPlayerStats.length > 0}
          trueComponent={
            <>
              {teamPlayerStats?.map((playerStats) => (
                <div
                  key={playerStats.playerId}
                  className="w-full flex justify-between items-center h-full space-x-2"
                >
                  <Input
                    defaultValue={playerStats.kills}
                    onChange={(e) => {
                      e.preventDefault();
                      setValue({
                        playerId: playerStats.playerId,
                        kills: Number(e.target.value),
                      });
                    }}
                    disabled={isPending}
                    className="max-w-[50px] min-w-[50px] w-full"
                  />
                  {!!value.playerId &&
                    value.playerId === playerStats.playerId && (
                      <Button
                        disabled={isPending}
                        onClick={() => onSubmit()}
                        size={"icon-sm"}
                      >
                        <SaveIcon />
                      </Button>
                    )}
                </div>
              ))}
            </>
          }
          falseComponent={<h1>N/A</h1>}
        />
      </div>
    </div>
  );
};

const UpdateTeamStatsPosition = ({
  teamId,
  position,
}: {
  teamId: string;
  position: number;
}) => {
  const form = useForm();

  const { matchId } = useMatchStore();
  const { mutate, isPending } = useMutation({
    mutationFn: (data: TeamStatsForm) =>
      http.put<TeamStatsForm>(
        ADMIN_TEAM_ENDPOINTS.GET_TEAM_STATS.replace(":teamId", teamId),
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const debounceMutate = debounce(
    (value: TeamStatsForm & { matchId: string }) => mutate(value),
    1500,
  );

  const onSubmit = (data: { position: number }) => {
    const payload: TeamStatsForm & { matchId: string } = {
      teamId: teamId,
      matchId: matchId,
      position: data.position,
      players: [],
    };

    debounceMutate(payload);
  };

  return (
    <Form {...form}>
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="flex gap-2 items-center max-w-[250px] justify-between flex-row">
          <FormField
            name={teamId}
            render={({ field: rField }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    disabled={isPending || matchId === "all"}
                    defaultValue={position}
                    onChange={(e) => {
                      rField.onChange(e);
                      onSubmit({
                        position: Number(e.target.value),
                      });
                    }}
                    className="max-w-[50px] min-w-[50px] w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
};
