import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { toast } from "sonner";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { useTournamentStore } from "@/src/store/tournament";
import React, { useState } from "react";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { AddPlayerToTeamDialog } from "@/src/components/admin/teams/add-player-to-team-dialog";

type Props = {
  page?: string;
};

export const useTeamsColumns = ({ page }: Props = { page: "1" }) => {
  const columns: ColumnDef<TeamT>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Team",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 font-medium">
            {row.original.name}
            {row.original.status === "PROCESSING" && (
              <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" title="Processing..." />
            )}
          </div>
        ),
      },
      {
        header: "Players",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.players?.length || 0}</span>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }) => <TeamActions team={row.original} page={page} />,
      },
    ],
    [page],
  );

  return { columns };
};

// Team action buttons component
const TeamActions = ({ team, page }: { team: TeamT; page?: string }) => {
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditPlayers, setShowEditPlayers] = useState(false);

  const { mutate: deleteTeam, isPending: isDeletingTeam } = useMutation({
    mutationFn: (id: string) =>
      http.delete(
        ADMIN_TEAM_ENDPOINTS.DELETE_TEAM_BY_ID.replace(":teamId", id),
      ),
    onSuccess: (data) => {
      setShowDeleteConfirm(false);
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: ["teams", tournamentId, matchId, page],
        });
      } else {
        toast.error(data.message);
      }
    },
  });

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Edit Players Button */}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setShowEditPlayers(true)}
          title="Edit Players"
        >
          <Pencil className="h-4 w-4" />
        </Button>

        {/* Delete Team Button */}
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          title="Delete Team"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Players Dialog */}
      <AddPlayerToTeamDialog
        teamId={team.id}
        open={showEditPlayers}
        onOpenChange={() => setShowEditPlayers(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{team.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTeam}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingTeam}
              onClick={(e) => {
                e.preventDefault();
                deleteTeam(team.id);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeletingTeam ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

