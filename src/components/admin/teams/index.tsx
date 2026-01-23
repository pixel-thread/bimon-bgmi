"use client";

import { useState } from "react";
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
import { useMatches } from "@/src/hooks/match/useMatches";
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
import { TournamentBulkEditDialog } from "./TournamentBulkEditDialog";
import { useGlobalBackground } from "@/src/hooks/gallery/useGlobalBackground";
import { SwapPlayersDialog } from "./swap-players-dialog";
import { ArrowLeftRight, Loader2, Pencil, Trash2 } from "lucide-react";
import { usePendingRefetch } from "@/src/store/match/usePendingRefetch";
import TeamsListModal from "./TeamsListModal";
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
  const [showTournamentBulkEdit, setShowTournamentBulkEdit] = useState(false);
  const [showSwapPlayers, setShowSwapPlayers] = useState(false);
  const [showTeamsListModal, setShowTeamsListModal] = useState(false);
  const { tournamentId } = useTournamentStore();
  const { seasonId } = useSeasonStore();
  const { data: tournament } = useTournament({ id: tournamentId });
  const { columns } = useTeamsColumns({ page });
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const updateId = search.get("update") || "";
  const teamStatId = search.get("teamStats") || "";
  const queryClient = useQueryClient();
  const { matchId, matchNumber, setMatchId } = useMatchStore();
  const { data: teams, isFetching, refetch, meta } = useTeams({ page });
  const { isLoading: isMatchesLoading } = useMatches();
  const { data: globalBackground } = useGlobalBackground();
  const { isPendingRefetch, setPendingRefetch } = usePendingRefetch();

  // Combined loading state for teams and matches
  const isLoading = isFetching || isMatchesLoading;

  // Auto-clear pending refetch when switching to "All Match" (prefetch already loaded it)
  React.useEffect(() => {
    if (matchId === "all" && isPendingRefetch) {
      setPendingRefetch(false);
    }
  }, [matchId, isPendingRefetch, setPendingRefetch]);

  // Handle refetch and clear pending flag
  const handleRefetch = () => {
    refetch();
    setPendingRefetch(false);
  };

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
      {/* Toolbar - Fully responsive design */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Selectors Row - Grid on mobile, flex on tablet, inline on desktop */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2 lg:gap-3">
          <SeasonSelector className="w-full sm:w-[120px] lg:w-fit lg:min-w-[120px]" />
          <TournamentSelector className="w-full sm:w-[120px] lg:w-fit lg:min-w-[160px]" />
          <MatchSelector className="w-full sm:w-[100px] lg:w-[120px]" />
        </div>

        {/* Actions Row - Centered on mobile, left-aligned on desktop */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start sm:gap-2 lg:gap-3">
          {/* View Actions */}
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => setShowStandingsModal(true)}
            title="View Standings"
          >
            <MedalIcon className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={handleRefetch}
            title={isPendingRefetch ? "Refetch needed!" : "Refresh"}
            className="relative"
          >
            <IconReload className="h-4 w-4" />
            {isPendingRefetch && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isLoading || !tournamentId}
            onClick={() => setShowTeamsListModal(true)}
            title="Teams List Screenshot"
          >
            <IconFileExport className="h-4 w-4" />
          </Button>

          {/* Separator - Hidden on mobile */}
          <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

          {/* Edit Actions */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            disabled={isLoading || !tournamentId || matchId === "" || matchId === "all"}
            title="Add Team"
          >
            <IconPlus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (matchId === "all") {
                setShowTournamentBulkEdit(true);
              } else {
                setShowBulkEdit(true);
              }
            }}
            disabled={isLoading || !tournamentId || matchId === ""}
            title={matchId === "all" ? "Select matches to bulk edit" : "Bulk Edit Stats"}
          >
            <Pencil className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Bulk Edit</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSwapPlayers(true)}
            disabled={isLoading || !tournamentId}
            title="Swap Players"
          >
            <ArrowLeftRight className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Swap</span>
          </Button>

          {matchId !== "all" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  disabled={isLoading || !matchId || isDeleting}
                  title="Delete Match"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin sm:mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 sm:mr-1" />
                  )}
                  <span className="hidden sm:inline">{isDeleting ? "Deleting..." : "Delete"}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="mx-4 max-w-[calc(100%-2rem)] sm:max-w-lg">
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
            {isPendingRefetch && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Stats saved! Click refetch to update Match {matchNumber}.</span>
              </div>
            )}
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
        backgroundImage={globalBackground?.publicUrl || "/images/image.webp"}
        tournamentTitle={tournament?.name || "Tournament"}
        maxMatchNumber={1}
        initialTeams={teams as any}
      />
      <BulkEditStatsDialog
        open={showBulkEdit}
        onOpenChange={setShowBulkEdit}
      />
      <TournamentBulkEditDialog
        open={showTournamentBulkEdit}
        onOpenChange={setShowTournamentBulkEdit}
      />
      <SwapPlayersDialog
        open={showSwapPlayers}
        onOpenChange={setShowSwapPlayers}
      />
      <TeamsListModal
        visible={showTeamsListModal}
        onClose={() => setShowTeamsListModal(false)}
        backgroundImage={globalBackground?.publicUrl || "/images/image.webp"}
        tournamentTitle={tournament?.name || "Tournament"}
        teams={teams as any}
        isLoading={isFetching}
      />
    </>
  );
};
