"use client";

import { useState } from "react";
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
import { PollTeamsPreviewDialog } from "@/src/components/admin/poll/PollTeamsPreviewDialog";
import type { PreviewTeamsByPollsResult } from "@/src/services/team/previewTeamsByPoll";

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const usePollColumns = () => {
  const queryClient = useQueryClient();

  // Preview state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewTeamsByPollsResult | null>(null);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedTeamSize, setSelectedTeamSize] = useState<number>(2);

  // Fetch team preview
  const { mutate: fetchPreview, isPending: isPreviewLoading } = useMutation({
    mutationFn: ({ id, size }: { id: string; size: number }) =>
      http.post<PreviewTeamsByPollsResult>(
        ADMIN_TEAM_ENDPOINTS.POST_PREVIEW_TEAM_BY_POLL.replace(
          ":size",
          size.toString(),
        ),
        { pollId: id },
      ),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setPreviewData(data.data);
      } else {
        toast.error(data.message || "Failed to generate preview");
        setPreviewDialogOpen(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate preview");
      setPreviewDialogOpen(false);
    },
  });

  // Create teams (after confirmation)
  const { mutate: createTeams, isPending: isCreating } = useMutation({
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
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        setPreviewDialogOpen(false);
        setPreviewData(null);
        setSelectedPollId(null);
        return data;
      }
      toast.error(data.message);
      return data;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create teams");
    },
  });

  // Handle preview button click
  const handlePreviewClick = (pollId: string, size: number) => {
    setSelectedPollId(pollId);
    setSelectedTeamSize(size);
    setPreviewData(null);
    setPreviewDialogOpen(true);
    fetchPreview({ id: pollId, size });
  };

  // Handle confirm
  const handleConfirm = () => {
    if (selectedPollId) {
      createTeams({ id: selectedPollId, size: selectedTeamSize });
    }
  };

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

  const { mutate: deletePoll, isPending: isDeleting } = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      http.delete(`/admin/poll/${id}`),
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
              disabled={isPreviewLoading || isCreating}
              key={i}
              onClick={() => handlePreviewClick(row.original.id, i + 1)}
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
    {
      header: "Delete",
      cell: ({ row }) => (
        <Button
          onClick={() => deletePoll({ id: row.original.id })}
          disabled={isDeleting}
          variant={"destructive"}
          size={"icon-sm"}
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // Preview Dialog component to render
  const PreviewDialog = (
    <PollTeamsPreviewDialog
      open={previewDialogOpen}
      onOpenChange={(open) => {
        setPreviewDialogOpen(open);
        if (!open) {
          setPreviewData(null);
          setSelectedPollId(null);
        }
      }}
      previewData={previewData}
      isLoading={isPreviewLoading}
      isConfirming={isCreating}
      onConfirm={handleConfirm}
      teamSize={selectedTeamSize}
    />
  );

  return { columns, PreviewDialog };
};
