"use client";

import { DataTable } from "../../data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  useTournamentWinner,
  PlayerPlacement,
  RecentTournament,
} from "@/src/hooks/winner/useTournamentWinner";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { useSeasonStore } from "@/src/store/season";
import { Trophy, Medal, Users } from "lucide-react";

const tournamentColumns: ColumnDef<any>[] = [
  {
    accessorKey: "tournamentName",
    header: "Tournament",
  },
  {
    header: "🥇 1st Place",
    accessorKey: "place1.teamName",
  },
  {
    header: "🥈 2nd Place",
    accessorKey: "place2.teamName",
  },
];

const placementColumns: ColumnDef<PlayerPlacement>[] = [
  {
    accessorKey: "playerName",
    header: "Player",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.playerName}</span>
    ),
  },
  {
    accessorKey: "firstPlaceCount",
    header: () => (
      <span className="flex items-center gap-1">
        🥇 1st Place
      </span>
    ),
    cell: ({ row }) => (
      <span className="font-bold text-yellow-600 dark:text-yellow-400">
        {row.original.firstPlaceCount}
      </span>
    ),
  },
  {
    accessorKey: "secondPlaceCount",
    header: () => (
      <span className="flex items-center gap-1">
        🥈 2nd Place
      </span>
    ),
    cell: ({ row }) => (
      <span className="font-bold text-gray-500 dark:text-gray-400">
        {row.original.secondPlaceCount}
      </span>
    ),
  },
  {
    accessorKey: "totalPlacements",
    header: "Total",
    cell: ({ row }) => (
      <span className="font-bold text-primary">
        {row.original.totalPlacements}
      </span>
    ),
  },
];

const recentTournamentColumns: ColumnDef<RecentTournament>[] = [
  {
    accessorKey: "tournamentName",
    header: "Tournament",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.tournamentName}</span>
    ),
  },
  {
    accessorKey: "firstPlace",
    header: () => (
      <span className="flex items-center gap-1">
        🥇 1st Place
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-yellow-600 dark:text-yellow-400">
        {row.original.firstPlace?.join(", ") || "-"}
      </span>
    ),
  },
  {
    accessorKey: "secondPlace",
    header: () => (
      <span className="flex items-center gap-1">
        🥈 2nd Place
      </span>
    ),
    cell: ({ row }) => (
      <span className="text-gray-500 dark:text-gray-400">
        {row.original.secondPlace?.join(", ") || "-"}
      </span>
    ),
  },
];

export const AdminWinnerPage = () => {
  const { seasonId } = useSeasonStore();
  const { data, isFetching } = useTournamentWinner({ seasonId });

  const tournaments = data?.tournaments || [];
  const playerPlacements = data?.recentStats?.playerPlacements || [];
  const recentTournaments = data?.recentStats?.recentTournaments || [];

  if (seasonId && isFetching) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* All Tournament Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            All Tournament Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={tournaments} columns={tournamentColumns} />
        </CardContent>
      </Card>

      {/* Player Placement Stats - Last 6 Tournaments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Player Placement Stats
            <span className="text-sm font-normal text-muted-foreground">
              (Last 6 Tournaments)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {playerPlacements.length > 0 ? (
            <DataTable data={playerPlacements} columns={placementColumns} />
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No placement data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Tournament Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-purple-500" />
            Recent Tournament Winners
            <span className="text-sm font-normal text-muted-foreground">
              (Last 6 Tournaments)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTournaments.length > 0 ? (
            <DataTable
              data={recentTournaments}
              columns={recentTournamentColumns}
            />
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No recent tournament data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

