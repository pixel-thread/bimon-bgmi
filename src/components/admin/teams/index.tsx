"use client";

import { useState } from "react";
import { CSVLink } from "react-csv";
import { LoaderFive } from "../../ui/loader";
import { DataTable } from "../../data-table";
import { useTeamsColumns } from "@/src/hooks/team/useTeamsColumns";
import { Ternary } from "../../common/Ternary";
import { useRouter, useSearchParams } from "next/navigation";
import { AddPlayerToTeamDialog } from "./add-player-to-team-dialog";
import { Button } from "../../ui/button";
import { CreateTeamDialog } from "./create-team-dialog";
import React from "react";
import { useTournamentStore } from "@/src/store/tournament";
import { TeamStatsSheet } from "./TeamStatsSheet";
import { useTeams } from "@/src/hooks/team/useTeams";
import { useTournament } from "@/src/hooks/tournament/useTournament";
import { IconFileExport, IconPlus, IconReload } from "@tabler/icons-react";
import {
  OverallStandingModal,
  TournamentSelector,
} from "../../teamManagementImports";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { SeasonSelector } from "../../SeasonSelector";
import MatchSelector from "../../match/MatchSelector";
import { MedalIcon } from "lucide-react";
import { toast } from "sonner";
import http from "@/src/utils/http";
import { TeamStatsForm } from "@/src/utils/validation/team/team-stats";
import { ADMIN_MATCH_ENDPOINTS } from "@/src/lib/endpoints/admin/match";
import { useSeasonStore } from "@/src/store/season";
import { BulkEditStatsDialog } from "./BulkEditStatsDialog";
import { useGlobalBackground } from "@/src/hooks/gallery/useGlobalBackground";
import { SwapPlayersDialog } from "./swap-players-dialog";
import { ArrowLeftRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../ui/alert-dialog";

export const AdminTeamsManagement: React.FC = () => {
  const search = useSearchParams();
  const page = "all";
  const [showStandingsModal, setShowStandingsModal] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showSwapPlayers, setShowSwapPlayers] = useState(false);
  const { tournamentId } = useTournamentStore();
  const { seasonId } = useSeasonStore();
  const { data: tournament } = useTournament({ id: tournamentId });
  const { columns } = useTeamsColumns({ page });
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const updateId = search.get("update") || "";
  const teamStatId = search.get("teamStats") || "";
  const queryClient = useQueryClient();
  const { matchId, setMatchId } = useMatchStore();
  const { data: teams, isFetching, refetch, meta } = useTeams({ page });
  const { data: globalBackground } = useGlobalBackground();

  // Prepare CSV export data with tournament title at top and total at bottom
  const csvData = React.useMemo(() => {
    if (!teams) return [];

    // Calculate total players across all teams
    const totalPlayers = teams.reduce((sum, team) => sum + (team.players?.length || 0), 0);

    // Title row (first row)
    const titleRow = [tournament?.name || "Tournament", ""];

    // Empty row for spacing
    const emptyRow = ["", ""];

    // Column headers row
    const headerRow = ["Slot No", "Players"];

    // Team data rows
    const teamRows = teams.map((team) => [
      team.slotNo,
      team.players?.map((p) => p.name).join(", ") || "",
    ]);

    // Footer row with total
    const footerRow = ["Total Players:", totalPlayers];

    return [titleRow, emptyRow, headerRow, ...teamRows, emptyRow, footerRow];
  }, [teams, tournament?.name]);

  const onValidateTeams = () => {
    queryClient.invalidateQueries({
      queryKey: ["teams", tournamentId, matchId, page],
    });
  };

  const onCloseUpdateDialog = () => {
    router.back();
    onValidateTeams();
  };

  const onCloseCreateTeam = () => {
    // CreateTeamDialog now handles cache updates directly via setQueryData
    // No refetch needed
    setOpen(false);
  };

  const { mutate: deleteMatch, isPending: isDeleting } = useMutation({
    mutationFn: () =>
      http.delete<TeamStatsForm>(
        ADMIN_MATCH_ENDPOINTS.DELETE_MATCH_BY_ID.replace(":id", matchId),
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: ["match", seasonId, tournamentId],
        });
        setMatchId("all");
        refetch();
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });
  return (
    <>
      {/* Toolbar - Clean, minimal design */}
      <div className="flex flex-col gap-4">
        {/* Selectors Row */}
        <div className="flex flex-wrap items-center gap-2">
          <SeasonSelector className="w-[120px]" />
          <TournamentSelector className="w-[120px]" />
          <MatchSelector className="w-[100px]" />
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Actions */}
          <Button
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => setShowStandingsModal(true)}
            title="View Standings"
          >
            <MedalIcon className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={() => refetch()}
            title="Refresh"
          >
            <IconReload className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isFetching || !tournamentId}
            asChild
            title="Export CSV"
          >
            <CSVLink
              filename={`${tournament?.name}.csv`}
              aria-disabled={isFetching}
              data={csvData}
            >
              <IconFileExport className="h-4 w-4" />
            </CSVLink>
          </Button>

          {/* Separator */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* Edit Actions */}
          <Button
            size="sm"
            variant="default"
            onClick={() => setOpen(true)}
            disabled={isFetching || !tournamentId || matchId === "" || matchId === "all"}
            title="Add Team"
          >
            <IconPlus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={() => setShowBulkEdit(true)}
            disabled={isFetching || !tournamentId || matchId === "" || matchId === "all"}
            title="Bulk Edit Stats"
          >
            <span>Bulk Edit</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSwapPlayers(true)}
            disabled={isFetching || !tournamentId}
            title="Swap Players"
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Swap</span>
          </Button>

          {matchId !== "all" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  disabled={isFetching || !matchId || isDeleting}
                  title="Delete Match"
                >
                  {isDeleting ? "Deleting..." : "Delete Match"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Match?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this match and all associated team stats, player stats, and records. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMatch()}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      <Ternary
        condition={isFetching}
        trueComponent={
          <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-4">
            <LoaderFive text="Loading teams..." />
          </div>
        }
        falseComponent={
          <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 space-y-6 py-4 sm:py-6">
            {teams && teams?.length > 0 && (
              <DataTable data={teams || []} columns={columns} meta={meta} />
            )}
            <CreateTeamDialog onOpenChange={onCloseCreateTeam} open={open} />
            <AddPlayerToTeamDialog
              teamId={updateId}
              onOpenChange={() => onCloseUpdateDialog()}
              open={!!updateId}
            />
            <TeamStatsSheet open={!!teamStatId} teamId={teamStatId} />
          </div>
        }
      />

      <OverallStandingModal
        visible={showStandingsModal}
        onClose={() => setShowStandingsModal(false)}
        backgroundImage={globalBackground?.publicUrl || "/images/image.png"}
        tournamentTitle={tournament?.name || "Tournament"}
        maxMatchNumber={1}
        initialTeams={teams as any}
      />
      <BulkEditStatsDialog
        open={showBulkEdit}
        onOpenChange={setShowBulkEdit}
      />
      <SwapPlayersDialog
        open={showSwapPlayers}
        onOpenChange={setShowSwapPlayers}
      />
    </>
  );
};
