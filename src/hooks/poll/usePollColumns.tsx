import { PollT } from "@/src/types/poll";
import { ColumnDef } from "@tanstack/react-table";
import { TrashIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { Switch } from "@/src/components/ui/switch";
import Link from "next/link";

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
    cell: ({ row }) => <Button variant={"outline"}>View</Button>,
  },
];

export const usePollColumns = () => {
  const queryClient = useQueryClient();
  const { mutate: deletePoll, isPending: isDeleting } = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      http.delete<{ id: string }>(`/admin/poll/${id}`),
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
      header: "Remove",
      cell: ({ row }) => (
        <Button
          onClick={() => deletePoll({ id: row.original.id })}
          disabled={isDeleting}
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
