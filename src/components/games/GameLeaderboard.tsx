"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Trophy, Medal, Crown } from "lucide-react";
import { LoaderFive } from "@/src/components/ui/loader";

interface LeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    highScore: number;
    lastPlayedAt: string;
}

interface GameLeaderboardProps {
    currentPlayerId?: string;
    maxEntries?: number;
    lastUpdated?: number;
}

export function GameLeaderboard({
    currentPlayerId,
    maxEntries = 10,
    lastUpdated,
}: GameLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch("/api/admin/games");
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.leaderboard.slice(0, maxEntries));
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, [maxEntries, lastUpdated]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-4 w-4 text-yellow-500" />;
            case 2:
                return <Medal className="h-4 w-4 text-slate-400" />;
            case 3:
                return <Medal className="h-4 w-4 text-amber-600" />;
            default:
                return (
                    <span className="w-4 text-center text-xs font-bold text-muted-foreground">
                        {rank}
                    </span>
                );
        }
    };

    const getRankBg = (rank: number, isCurrentPlayer: boolean) => {
        if (isCurrentPlayer) {
            return "bg-primary/10 border-l-2 border-l-primary";
        }
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-yellow-500/10 to-transparent";
            case 2:
                return "bg-gradient-to-r from-slate-400/10 to-transparent";
            case 3:
                return "bg-gradient-to-r from-amber-600/10 to-transparent";
            default:
                return "";
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">Leaderboard</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <LoaderFive text="Loading..." />
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No scores yet</p>
                        <p className="text-xs">Be the first to play!</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {leaderboard.map((entry) => {
                            const isCurrentPlayer = entry.playerId === currentPlayerId;
                            return (
                                <div
                                    key={entry.playerId}
                                    className={`px-4 py-3 flex items-center gap-3 transition-colors ${getRankBg(
                                        entry.rank,
                                        isCurrentPlayer
                                    )}`}
                                >
                                    <div className="flex items-center justify-center w-6">
                                        {getRankIcon(entry.rank)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`text-sm truncate ${isCurrentPlayer ? "font-bold" : "font-medium"
                                                }`}
                                        >
                                            {entry.playerName}
                                            {isCurrentPlayer && (
                                                <span className="ml-1 text-xs text-primary">(You)</span>
                                            )}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={isCurrentPlayer ? "default" : "secondary"}
                                        className="text-xs font-bold"
                                    >
                                        {entry.highScore}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
