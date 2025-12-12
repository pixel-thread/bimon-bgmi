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
import { useGlobalBackground } from "@/src/hooks/gallery/useGlobalBackground";
import { SwapPlayersDialog } from "./swap-players-dialog";
import { ArrowLeftRight, Loader2, Pencil, Trash2 } from "lucide-react";
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
  const { isLoading: isMatchesLoading } = useMatches();
  const { data: globalBackground } = useGlobalBackground();

  // Combined loading state for teams and matches
  const isLoading = isFetching || isMatchesLoading;

  // Export to Excel with merged cells and centered text
  const exportToExcel = React.useCallback(async () => {
    if (!teams) return;

    const ExcelJS = (await import("exceljs")).default;

    // Deduplicate teams based on player composition (sorted player names as key)
    const seenTeams = new Set<string>();
    const uniqueTeams = teams.filter((team) => {
      const playerKey = (team.players?.map((p) => p.name).sort().join(",")) || team.id;
      if (seenTeams.has(playerKey)) {
        return false;
      }
      seenTeams.add(playerKey);
      return true;
    });

    // Calculate total players across unique teams
    const totalPlayers = uniqueTeams.reduce((sum, team) => sum + (team.players?.length || 0), 0);

    // Find the maximum number of players in any team
    const maxPlayers = Math.max(...uniqueTeams.map((team) => team.players?.length || 0), 1);
    const totalColumns = maxPlayers + 1; // Slot No + Player columns

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Teams");

    // Set column widths
    worksheet.columns = [
      { width: 12 }, // Slot No
      ...Array(maxPlayers).fill({ width: 18 }), // Player columns
    ];

    // Row 1: Title row (merged across all columns)
    const titleRow = worksheet.addRow([tournament?.name || "Tournament"]);
    worksheet.mergeCells(1, 1, 1, totalColumns);
    titleRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    titleRow.getCell(1).font = { name: "PUBG SANS", bold: true, size: 14 };
    titleRow.height = 24;

    // Row 2: Empty row for spacing (merged)
    const emptyRow1 = worksheet.addRow([""]);
    worksheet.mergeCells(2, 1, 2, totalColumns);

    // Row 3: Column headers
    const headerData = ["Slot No", ...Array(maxPlayers).fill(0).map((_, i) => `Player ${i + 1}`)];
    const headerRow = worksheet.addRow(headerData);
    headerRow.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.font = { name: "PUBG SANS", bold: true };
    });

    // Team data rows - use index+2 for slot number to ensure sequential numbering
    uniqueTeams.forEach((team, index) => {
      const players = team.players?.map((p) => p.name) || [];
      const paddedPlayers = [...players, ...Array(maxPlayers - players.length).fill("")];
      const row = worksheet.addRow([index + 2, ...paddedPlayers]); // Sequential slot numbers starting from 2
      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.font = { name: "PUBG SANS" };
      });
    });

    // Empty row for spacing (merged)
    const emptyRow2Index = worksheet.rowCount + 1;
    const emptyRow2 = worksheet.addRow([""]);
    worksheet.mergeCells(emptyRow2Index, 1, emptyRow2Index, totalColumns);

    // Footer row: Total Players in one merged cell
    const footerRowIndex = worksheet.rowCount + 1;
    const footerRow = worksheet.addRow([`Total Players: ${totalPlayers}`]);
    worksheet.mergeCells(footerRowIndex, 1, footerRowIndex, totalColumns);
    footerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    footerRow.getCell(1).font = { name: "PUBG SANS", bold: true };

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${tournament?.name || "Teams"}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
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
            onClick={() => refetch()}
            title="Refresh"
          >
            <IconReload className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={isLoading || !tournamentId}
            onClick={exportToExcel}
            title="Export Excel"
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
            onClick={() => setShowBulkEdit(true)}
            disabled={isLoading || !tournamentId || matchId === "" || matchId === "all"}
            title="Bulk Edit Stats"
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
