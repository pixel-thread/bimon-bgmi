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

const headers = [
  { label: "Total Players", key: "size" },
  { label: "Team Name", key: "name" },
  { label: "Slot No", key: "slotNo" },
];

export const AdminTeamsManagement: React.FC = () => {
  const search = useSearchParams();
  const page = "all";
  const [showStandingsModal, setShowStandingsModal] = useState(false);
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
    onValidateTeams();
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
      <div className="flex flex-col sm:flex-row gap-2 gap-y-5 items-start sm:items-center">
        <div className="w-full flex flex-col md:flex-row justify-end items-center gap-x-2 gap-y-5">
          <div className="flex flex-wrap md:flex-nowrap gap-2 justify-center md:justify-end w-full md:w-auto">
            <SeasonSelector className="w-full max-w-[110px]" />
            <TournamentSelector className="w-full max-w-[110px]" />
            <MatchSelector className="w-[100px] max-w-[110px]" />
          </div>
          <div className="flex items-center justify-center md:justify-end md:w-auto w-full gap-2">
            <Button
              disabled={isFetching}
              onClick={() => setShowStandingsModal(true)}
            >
              <MedalIcon />
            </Button>
            <Button
              disabled={isFetching}
              onClick={() => refetch()}
              className="w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
            >
              <IconReload />
            </Button>

            <Button
              disabled={isFetching || !tournamentId}
              className="w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
              asChild
            >
              <CSVLink
                filename={`${tournament?.name}.csv`}
                aria-disabled={isFetching}
                data={teams || []}
                className="w-auto"
                headers={headers}
              >
                <IconFileExport />
              </CSVLink>
            </Button>
            <Button
              onClick={() => setOpen(true)}
              disabled={
                isFetching ||
                !tournamentId ||
                matchId === "" ||
                matchId === "all"
              }
              className="w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
            >
              <IconPlus />
            </Button>

            {matchId !== "all" && (
              <Button
                variant={"destructive"}
                disabled={isFetching || !matchId || isDeleting}
                onClick={() => deleteMatch()}
              >
                Delete Match
              </Button>
            )}
          </div>
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
        backgroundImage={"/images/image.png"}
        tournamentTitle={"Tournament"}
        maxMatchNumber={1}
      />
    </>
  );
};
