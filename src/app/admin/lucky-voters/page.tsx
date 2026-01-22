"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Gift,
    Users,
    Coins,
    Trophy,
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";
import { format } from "date-fns";

type LuckyVoterEntry = {
    id: string;
    playerId: string;
    playerName: string;
    tournamentId: string;
    tournamentName: string;
    entryFee: number;
    seasonId: string;
    date: string;
};

type SeasonStat = {
    seasonId: string;
    seasonName: string;
    count: number;
    ucSaved: number;
};

type LuckyVoterStats = {
    summary: {
        totalFreeEntries: number;
        totalUCSaved: number;
        uniquePlayers: number;
    };
    seasonStats: SeasonStat[];
    entries: LuckyVoterEntry[];
};

type ApiResponse<T> = {
    data: T;
};

export default function LuckyVotersAdminPage() {
    const { getToken, isSignedIn } = useAuth();
    const { user } = useAuthContext();

    const fetchWithAuth = async <T,>(url: string): Promise<ApiResponse<T> | null> => {
        const token = await getToken({ template: "jwt" });
        if (!token) return null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
    };

    const { data: response, isLoading } = useQuery({
        queryKey: ["lucky-voters-stats"],
        queryFn: () => fetchWithAuth<LuckyVoterStats>("/admin/lucky-voters"),
        enabled: isSignedIn && user?.role === "SUPER_ADMIN",
    });

    const stats = response?.data;

    if (user?.role !== "SUPER_ADMIN") {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Super Admin access required</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Gift className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Lucky Voter Tracker</h1>
                    <p className="text-sm text-muted-foreground">
                        Free entry winners per tournament
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            {isLoading ? (
                <div className="grid gap-3 grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-3 grid-cols-3">
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Free Entries</p>
                            <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.totalFreeEntries || 0}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">UC Given Away</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-500">{stats?.summary?.totalUCSaved || 0} UC</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">Players Helped</p>
                            <p className="text-xl sm:text-2xl font-bold">{stats?.summary?.uniquePlayers || 0}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Season Stats */}
            {stats?.seasonStats && stats.seasonStats.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
                    <h2 className="text-lg font-bold mb-4">By Season</h2>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                        {stats.seasonStats.map((season) => (
                            <div
                                key={season.seasonId}
                                className="flex flex-col p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50"
                            >
                                <span className="text-sm font-semibold">{season.seasonName}</span>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">{season.count} winners</span>
                                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                        {season.ucSaved} UC
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Winners List */}
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
                <h2 className="text-lg font-bold mb-4">All Lucky Winners</h2>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : stats?.entries && stats.entries.length > 0 ? (
                    <>
                        {/* Mobile Card Layout */}
                        <div className="space-y-3 md:hidden">
                            {stats.entries.map((entry) => (
                                <div key={entry.id} className="rounded-xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold">{entry.playerName}</span>
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                                            🎉 {entry.entryFee} UC
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Trophy className="h-3 w-3" />
                                            {entry.tournamentName}
                                        </span>
                                        <span>{format(new Date(entry.date), "MMM d, yyyy")}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table Layout */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-200 dark:border-zinc-800">
                                        <TableHead>Player</TableHead>
                                        <TableHead>Tournament</TableHead>
                                        <TableHead className="text-center">UC Saved</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stats.entries.map((entry) => (
                                        <TableRow key={entry.id} className="border-zinc-200 dark:border-zinc-800">
                                            <TableCell className="font-semibold">{entry.playerName}</TableCell>
                                            <TableCell>{entry.tournamentName}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                                    🎁 {entry.entryFee} UC
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {format(new Date(entry.date), "MMM d, yyyy")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No lucky voters yet</p>
                        <p className="text-xs mt-1">Winners will appear after teams are created from polls</p>
                    </div>
                )}
            </div>
        </div>
    );
}
