import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { toast } from "sonner";
import { MoreVertical } from "lucide-react";
import { useTournamentStore } from "@/src/store/tournament";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import React from "react";

const col: ColumnDef<TeamT>[] = [
  {
    accessorKey: "name",
    header: "Team Name",
    cell: ({ row }) => (
      <Link href={`?teamStats=${row.original.id}`}>{row.original.name}</Link>
    ),
  },
  {
    accessorKey: "size",
    header: "Team Size",
  },
  {
    accessorKey: "slotNo",
    header: "Slot No.",
  },
  {
    accessorKey: "kills",
    header: "Kills",
  },
];

export const useTeamsColumns = () => {
  const columns: ColumnDef<TeamT>[] = React.useMemo(
    () => [
      ...col,
      {
        header: "Action",
        cell: ({ row }) => <ActionDropdown id={row.original.id} />,
      },
    ],
    [],
  );

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
