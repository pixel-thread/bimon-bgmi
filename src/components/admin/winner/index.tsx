"use client";

import { useState, useEffect } from "react";
import { DataTable } from "../../data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  useTournamentWinner,
  PlayerPlacement,
  RecentTournament,
} from "@/src/hooks/winner/useTournamentWinner";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { useSeasonStore } from "@/src/store/season";
import { Trophy, Medal, Users, Check, Clock } from "lucide-react";
import { Badge } from "../../ui/badge";
import { useAppContext } from "@/src/hooks/context/useAppContext";

type TournamentResult = {
  tournamentId: string;
  tournamentName: string;
  createdAt: Date;
  place1: {
    teamName: string;
    teamId: string;
    amount: number;
    isDistributed: boolean;
    players?: { id: string; name: string }[];
  } | null;
  place2: {
    teamName: string;
    teamId: string;
    amount: number;
    isDistributed: boolean;
    players?: { id: string; name: string }[];
  } | null;
};

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
  const { seasonId, setSeasonId } = useSeasonStore();
  const { activeSeason, isLoading: isActiveSeasonLoading } = useAppContext();

  useEffect(() => {
    if (!seasonId && activeSeason?.id) {
      setSeasonId(activeSeason.id);
    }
  }, [seasonId, activeSeason, setSeasonId]);

  const { data, isFetching } = useTournamentWinner({
    seasonId: seasonId || activeSeason?.id || ""
  });

  const tournaments = (data?.tournaments || []) as TournamentResult[];
  const playerPlacements = data?.recentStats?.playerPlacements || [];
  const recentTournaments = data?.recentStats?.recentTournaments || [];

  // Check if any winner in the tournament has been distributed
  const isDistributed = (tournament: TournamentResult) => {
    const place1Distributed = tournament.place1?.isDistributed ?? true;
    const place2Distributed = tournament.place2?.isDistributed ?? true;
    return place1Distributed && place2Distributed;
  };

  // Get total amount distributed
  const getTotalDistributed = (tournament: TournamentResult) => {
    const amount1 = tournament.place1?.amount || 0;
    const amount2 = tournament.place2?.amount || 0;
    return amount1 + amount2;
  };

  // Tournament columns - now just showing status (no action button)
  const tournamentColumns: ColumnDef<TournamentResult>[] = [
    {
      accessorKey: "tournamentName",
      header: "Tournament",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.tournamentName}</span>
      ),
    },
    {
      header: "🥇 1st Place",
      accessorKey: "place1.teamName",
      cell: ({ row }) => (
        <div>
          <span className="text-yellow-600 dark:text-yellow-400">
            {row.original.place1?.teamName || "-"}
          </span>
          {row.original.place1?.amount ? (
            <span className="ml-2 text-xs text-muted-foreground">
              (₹{row.original.place1.amount})
            </span>
          ) : null}
        </div>
      ),
    },
    {
      header: "🥈 2nd Place",
      accessorKey: "place2.teamName",
      cell: ({ row }) => (
        <div>
          <span className="text-gray-500 dark:text-gray-400">
            {row.original.place2?.teamName || "-"}
          </span>
          {row.original.place2?.amount ? (
            <span className="ml-2 text-xs text-muted-foreground">
              (₹{row.original.place2.amount})
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "status",
      header: "UC Status",
      cell: ({ row }) => {
        const tournament = row.original;
        const totalAmount = getTotalDistributed(tournament);

        if (isDistributed(tournament)) {
          return (
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {totalAmount > 0 ? `₹${totalAmount} Distributed` : "Distributed"}
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="gap-1 text-amber-600">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      },
    },
  ];

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
