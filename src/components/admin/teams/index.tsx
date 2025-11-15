"use client";

import { LoaderFive } from "../../ui/loader";
import { DataTable } from "../../data-table";
import { useTeamsColumns } from "@/src/hooks/team/useTeamsColumns";
import { Ternary } from "../../common/Ternary";
import { useRouter, useSearchParams } from "next/navigation";
import { AddPlayerToTeamDialog } from "./add-player-to-team-dialog";
import { Button } from "../../ui/button";
import { CreateTeamDialog } from "./create-team";
import React, { useEffect } from "react";
import { useTournamentStore } from "@/src/store/tournament";
import { TeamStatsSheet } from "./TeamStatsSheet";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { useTeams } from "@/src/hooks/team/useTeams";

export const AdminTeamsManagement: React.FC = () => {
  const { tournamentId } = useTournamentStore();
  const { matchId } = useMatchStore();
  const { columns } = useTeamsColumns();
  const [open, setOpen] = React.useState(false);
  const search = useSearchParams();
  const router = useRouter();
  const updateId = search.get("update") || "";
  const teamStatId = search.get("teamStats") || "";

  const { data: teams, isFetching } = useTeams();

  const onCloseUpdateDialog = () => router.back();

  const onValueChange = () => router.back();

  return (
    <Ternary
      condition={!tournamentId || !matchId}
      trueComponent={
        <Ternary
          condition={isFetching}
          trueComponent={
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-4">
              <LoaderFive text="Loading teams..." />
            </div>
          }
          falseComponent={
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-4">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Teams Management
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                Create and manage tournament teams
              </p>
            </div>
          }
        />
      }
      falseComponent={
        <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 space-y-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Teams Management
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                Create and manage tournament teams
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <Button
                onClick={() => setOpen(true)}
                disabled={isFetching || !tournamentId}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
              >
                Create Team
              </Button>
            </div>
          </div>
          {matchId && teams && <DataTable data={teams} columns={columns} />}
          <CreateTeamDialog onOpenChange={() => setOpen(!open)} open={open} />
          <AddPlayerToTeamDialog
            teamId={updateId}
            onOpenChange={() => onCloseUpdateDialog()}
            open={!!updateId}
          />
          <TeamStatsSheet
            open={!!teamStatId}
            teamId={teamStatId}
            onValueChange={onValueChange}
          />
        </div>
      }
    />
  );
};
