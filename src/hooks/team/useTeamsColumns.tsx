import { ColumnDef } from "@tanstack/react-table";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { toast } from "sonner";
import { MoreVertical, TrashIcon } from "lucide-react";
import { useTournamentStore } from "@/src/store/tournament";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

const col: ColumnDef<TeamT>[] = [
  {
    accessorKey: "name",
    header: "Team Name",
    cell: ({ row }) => (
      <Link href={`/admin/teams?teamStats=${row.original.id}`}>
        {row.original.players.map((player) => player.user.userName).join("_") ||
          row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "players.length",
    header: "Team Size",
  },
  {
    header: "Team Players",
    cell: ({ row }) => (
      <>
        {row.original.players.map((player) => player.user.userName).join(", ")}
      </>
    ),
  },
];

export const useTeamsColumns = () => {
  const { matchId } = useMatchStore();
  const columns: ColumnDef<TeamT>[] = [
    ...col,
    {
      header: "Kills",
      cell: ({ row }) => (
        <>
          {matchId
            ? row.original.teamStats
                .filter((stat) => stat.matchId === matchId)
                .reduce((acc, curr) => acc + curr.kills, 0)
            : row.original.teamStats.reduce((acc, curr) => acc + curr.kills, 0)}
        </>
      ),
    },
    {
      header: "Deaths",
      cell: ({ row }) => (
        <>
          {matchId
            ? row.original.teamStats
                .filter((stat) => stat.matchId === matchId)
                .reduce((acc, curr) => acc + curr.deaths, 0)
            : row.original.teamStats.reduce(
                (acc, curr) => acc + curr.deaths,
                0,
              )}
        </>
      ),
    },
    {
      header: "Action",
      cell: ({ row }) => <ActionDropdown id={row.original.id} />,
    },
  ];

  return { columns };
};

const ActionDropdown = ({ id }: { id: string }) => {
  const { tournamentId } = useTournamentStore();
  const queryClient = useQueryClient();

  const { mutate: deleteTeam, isPending: isDeletingTeam } = useMutation({
    mutationFn: (id: string) =>
      http.delete(
        ADMIN_TEAM_ENDPOINTS.DELETE_TEAM_BY_ID.replace(":teamId", id),
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["team", tournamentId] });
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
