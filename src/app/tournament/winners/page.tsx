"use client";

import { DataTable } from "@/src/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
    useTournamentWinner,
    PlayerPlacement,
    RecentTournament,
} from "@/src/hooks/winner/useTournamentWinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { useActiveSeason } from "@/src/hooks/season/useActiveSeason";
import { Trophy, Medal, Users, Loader2 } from "lucide-react";

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

export default function WinnersPage() {
    // Auto-fetch active season
    const { data: activeSeason, isLoading: isLoadingSeason } = useActiveSeason();
    const seasonId = activeSeason?.id || "";

    const { data, isFetching } = useTournamentWinner({ seasonId });

    const playerPlacements = data?.recentStats?.playerPlacements || [];
    const recentTournaments = data?.recentStats?.recentTournaments || [];

    // Show loading while fetching season or winner data
    if (isLoadingSeason || (seasonId && isFetching)) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading winners...</span>
            </div>
        );
    }

    // No active season found
    if (!activeSeason) {
        return (
            <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active season found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 max-w-7xl mx-auto">
            {/* Player Placement Stats - Last 6 Tournaments */}
            <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
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
            <Card className="bg-gradient-to-br from-background to-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
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
}
