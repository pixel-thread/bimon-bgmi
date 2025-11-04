import { PollT } from "@/src/types/poll";
import { ColumnDef } from "@tanstack/react-table";
import { TrashIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { Switch } from "@/src/components/ui/switch";
import Link from "next/link";
import { ButtonGroup } from "@/src/components/ui/button-group";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";

const col: ColumnDef<PollT>[] = [
  {
    accessorKey: "tournament.name",
    header: "Tournament",
  },
  {
    accessorKey: "question",
    header: "Question",
  },
  {
    header: "Option 1",
    cell: ({ row }) => row.original.options[0].name,
  },
  {
    header: "Vote Option 1",
    cell: ({ row }) => row.original.options[0].vote,
  },
  {
    header: "Option 2",
    cell: ({ row }) => row.original.options[1].name,
  },
  {
    header: "Vote Option 2",
    cell: ({ row }) => row.original.options[1].vote,
  },
  {
    header: "Option 3",
    cell: ({ row }) => row.original.options[2].name,
  },
  {
    header: "Vote Option 3",
    cell: ({ row }) => row.original.options[2].vote,
  },
  {
    header: "Edit",
    cell: ({ row }) => (
      <Link href={`/admin/polls?update=${row.original.id}`}>Edit</Link>
    ),
  },
  {
    header: "View Votes",
    cell: ({ row }) => (
      <Link href={`/admin/polls?view=${row.original.id}`}>View</Link>
    ),
  },
];

export const usePollColumns = () => {
  const queryClient = useQueryClient();

  const { mutate: bulkTeam, isPending: isBulking } = useMutation({
    mutationFn: ({ id, size }: { id: string; size: number }) =>
      http.post<PollT>(
        ADMIN_TEAM_ENDPOINTS.POST_CREATE_TEAM_BY_POLL.replace(
          ":size",
          size.toString(),
        ),
        { pollId: id },
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
        return data;
      }
      toast.success(data.message);
      return data;
    },
  });

  const { mutate: updatePollStatus, isPending: isToggling } = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      http.get<PollT>(`/admin/poll/${id}/toggle-status`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
        return data;
      }
      toast.success(data.message);
      return data;
    },
  });

  const { mutate: deleteTeams, isPending: isTeamsDeleting } = useMutation({
    mutationFn: (data: { tournamentId: string }) =>
      http.post<PollT>(
        ADMIN_TEAM_ENDPOINTS.POST_DELETE_TEAMS_BY_TOURNAMENT_ID,
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
        return data;
      }
      toast.success(data.message);
      return data;
    },
  });

  const columns: ColumnDef<PollT>[] = [
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => (
        <Switch
          onCheckedChange={() => updatePollStatus({ id: row.original.id })}
          disabled={isToggling}
          checked={row.original.isActive}
        />
      ),
    },
    ...col,
    {
      header: "Bulk Team",
      cell: ({ row }) => (
        <ButtonGroup>
          {Array.from({ length: 4 }).map((_, i) => (
            <Button
              disabled={isBulking}
              onClick={() => bulkTeam({ id: row.original.id, size: i + 1 })}
              variant={i === 1 ? "default" : "outline"}
            >
              {i + 1}
            </Button>
          ))}
        </ButtonGroup>
      ),
    },
    {
      header: "Remove Teams",
      cell: ({ row }) => (
        <Button
          onClick={() =>
            deleteTeams({ tournamentId: row.original.tournamentId })
          }
          disabled={isTeamsDeleting}
          variant={"destructive"}
          size={"icon-sm"}
        >
          <TrashIcon />
        </Button>
      ),
    },
  ];

  return { columns };
};
