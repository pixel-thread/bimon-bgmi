"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, Users, Filter, ChevronRight, AlertTriangle } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";
import { cn } from "@/src/lib/utils";
import Link from "next/link";

type Player = {
    id: string;
    displayName: string;
    userName: string;
    meritScore: number;
    isSoloRestricted: boolean;
    totalRatings: number;
    averageRating: number;
};

type Tournament = {
    id: string;
    name: string;
};

type MeritRatingsResponse = {
    data: {
        players: Player[];
        tournaments: Tournament[];
        summary: {
            totalPlayers: number;
            restrictedPlayers: number;
            totalRatings: number;
        };
    };
};

// Merit score badge with color coding
const MeritBadge = ({ score, isRestricted }: { score: number; isRestricted: boolean }) => {
    const getColor = () => {
        if (isRestricted) return "bg-red-500/20 text-red-400 border-red-500/30";
        if (score < 50) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
        if (score < 70) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        return "bg-green-500/20 text-green-400 border-green-500/30";
    };

    return (
        <div className={cn("px-3 py-1 rounded-full border text-sm font-bold min-w-[50px] text-center", getColor())}>
            {score}%
        </div>
    );
};

// Player card that links to detail page
const PlayerCard = ({ player }: { player: Player }) => {
    return (
        <Link href={`/admin/merit-ratings/${player.id}`}>
            <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 flex items-center justify-between hover:bg-zinc-800 hover:border-zinc-600 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                    <MeritBadge score={player.meritScore} isRestricted={player.isSoloRestricted} />
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold">{player.displayName}</p>
                            {player.isSoloRestricted && (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">@{player.userName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                            {player.totalRatings} rating{player.totalRatings !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Avg: {player.averageRating} ⭐
                        </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
            </div>
        </Link>
    );
};

export default function MeritRatingsPage() {
    const [tournamentId, setTournamentId] = useState<string>("all");
    const { getToken, isSignedIn } = useAuth();
    const { user } = useAuthContext();

    const fetchWithAuth = async <T,>(url: string): Promise<T | null> => {
        const token = await getToken({ template: "jwt" });
        if (!token) return null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch");
        return response.json();
    };

    const { data, isLoading } = useQuery({
        queryKey: ["merit-ratings", tournamentId],
        queryFn: () =>
            fetchWithAuth<MeritRatingsResponse>(
                `/admin/merit-ratings${tournamentId !== "all" ? `?tournamentId=${tournamentId}` : ""}`
            ),
        enabled: isSignedIn && !!user,
    });

    const players = data?.data?.players || [];
    const tournaments = data?.data?.tournaments || [];
    const summary = data?.data?.summary;

    return (
        <div className="space-y-6 max-w-3xl mx-auto px-2 sm:px-4 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/25">
                            <Star className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Merit Ratings</h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-13">
                        Players sorted by merit (lowest first)
                    </p>
                </div>
                <Select value={tournamentId} onValueChange={setTournamentId}>
                    <SelectTrigger className="w-[250px] rounded-xl">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by Tournament" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="all">All Tournaments</SelectItem>
                        {tournaments.map((tournament) => (
                            <SelectItem key={tournament.id} value={tournament.id}>
                                {tournament.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl p-4 bg-zinc-900 border border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Players Rated</p>
                                <p className="text-2xl font-bold">{summary.totalPlayers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl p-4 bg-zinc-900 border border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Solo Restricted</p>
                                <p className="text-2xl font-bold">{summary.restrictedPlayers}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl p-4 bg-zinc-900 border border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <span className="text-lg">⭐</span>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Ratings</p>
                                <p className="text-2xl font-bold">{summary.totalRatings}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Players List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl" />
                        ))}
                    </div>
                ) : players.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground rounded-2xl bg-zinc-900 border border-zinc-800">
                        <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No merit ratings found</p>
                        <p className="text-sm mt-1">Ratings will appear here after players rate their teammates</p>
                    </div>
                ) : (
                    players.map((player) => (
                        <PlayerCard key={player.id} player={player} />
                    ))
                )}
            </div>
        </div>
    );
}
