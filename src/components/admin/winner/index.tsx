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
import { Trophy, Medal, Users, Coins, Check } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { DistributeUCDialog } from "./DistributeUCDialog";
import { useActiveSeason } from "@/src/hooks/season/useActiveSeason";

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
  const { data: activeSeason, isLoading: isActiveSeasonLoading } = useActiveSeason();

  useEffect(() => {
    if (!seasonId && activeSeason?.id) {
      setSeasonId(activeSeason.id);
    }
  }, [seasonId, activeSeason, setSeasonId]);

  const { data, isFetching } = useTournamentWinner({
    seasonId: seasonId || activeSeason?.id || ""
  });

  const [selectedTournament, setSelectedTournament] = useState<{
    id: string;
    name: string;
    winners: { position: number; teamName: string; teamId: string; amount: number; isDistributed: boolean }[];
  } | null>(null);

  const tournaments = (data?.tournaments || []) as TournamentResult[];
  const playerPlacements = data?.recentStats?.playerPlacements || [];
  const recentTournaments = data?.recentStats?.recentTournaments || [];

  const handleDistributeClick = (tournament: TournamentResult) => {
    const winners = [];
    if (tournament.place1) {
      winners.push({
        position: 1,
        teamName: tournament.place1.teamName,
        teamId: tournament.place1.teamId,
        amount: tournament.place1.amount,
        isDistributed: tournament.place1.isDistributed,
        players: tournament.place1.players,
      });
    }
    if (tournament.place2) {
      winners.push({
        position: 2,
        teamName: tournament.place2.teamName,
        teamId: tournament.place2.teamId,
        amount: tournament.place2.amount,
        isDistributed: tournament.place2.isDistributed,
        players: tournament.place2.players,
      });
    }
    setSelectedTournament({
      id: tournament.tournamentId,
      name: tournament.tournamentName,
      winners,
    });
  };

  // Check if any winner in the tournament has not been distributed
  const needsDistribution = (tournament: TournamentResult) => {
    const place1NotDistributed = tournament.place1 && !tournament.place1.isDistributed;
    const place2NotDistributed = tournament.place2 && !tournament.place2.isDistributed;
    return place1NotDistributed || place2NotDistributed;
  };

  // Tournament columns with action button
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
        <span className="text-yellow-600 dark:text-yellow-400">
          {row.original.place1?.teamName || "-"}
        </span>
      ),
    },
    {
      header: "🥈 2nd Place",
      accessorKey: "place2.teamName",
      cell: ({ row }) => (
        <span className="text-gray-500 dark:text-gray-400">
          {row.original.place2?.teamName || "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "UC Status",
      cell: ({ row }) => {
        const tournament = row.original;
        if (needsDistribution(tournament)) {
          return (
            <Button
              size="sm"
              variant="outline"
              className="gap-1 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
              onClick={() => handleDistributeClick(tournament)}
            >
              <Coins className="h-4 w-4" />
              Distribute UC
            </Button>
          );
        }
        return (
          <Badge variant="secondary" className="gap-1">
            <Check className="h-3 w-3" />
            Distributed
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

      {/* Distribute UC Dialog */}
      {selectedTournament && (
        <DistributeUCDialog
          isOpen={!!selectedTournament}
          onClose={() => setSelectedTournament(null)}
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.name}
          winners={selectedTournament.winners}
        />
      )}
    </div>
  );
};
