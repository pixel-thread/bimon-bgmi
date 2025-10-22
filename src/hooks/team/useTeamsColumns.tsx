import { ColumnDef } from "@tanstack/react-table";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { toast } from "sonner";
import { TrashIcon } from "lucide-react";
import { useTournamentStore } from "@/src/store/tournament";

const col: ColumnDef<TeamT>[] = [
  {
    accessorKey: "name",
    header: "Team Name",
    cell: ({ row }) => (
      <>
        {row.original.players.map((player) => player.user.userName).join("_") ||
          row.original.name}
      </>
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
  {
    header: "Action",
    cell: ({ row }) => (
      <Link
        className={buttonVariants({ size: "sm", variant: "default" })}
        href={`/admin/teams?update=${row.original.id}`}
      >
        Update
      </Link>
    ),
  },
];

export const useTeamsColumns = () => {
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
  const columns: ColumnDef<TeamT>[] = [
    ...col,

    {
      header: "Delete",
      cell: ({ row }) => (
        <Button
          disabled={isDeletingTeam}
          size={"icon-sm"}
          variant={"destructive"}
          onClick={() => deleteTeam(row.original.id)}
        >
          <TrashIcon />
        </Button>
      ),
    },
  ];

  return { columns };
};
