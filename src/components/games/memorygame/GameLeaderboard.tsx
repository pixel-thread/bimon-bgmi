"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Crown, Sparkles } from "lucide-react";

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
    preloadedData?: LeaderboardEntry[];
}

export function GameLeaderboard({
    currentPlayerId,
    maxEntries = 10,
    lastUpdated,
    preloadedData,
}: GameLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(preloadedData || []);
    const [isLoading, setIsLoading] = useState(!preloadedData);

    useEffect(() => {
        // Skip fetch if preloaded data is provided
        if (preloadedData) {
            setLeaderboard(preloadedData.slice(0, maxEntries));
            setIsLoading(false);
            return;
        }

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
    }, [maxEntries, lastUpdated, preloadedData]);

    const topScore = leaderboard[0]?.highScore || 1;

    const getRankStyle = (rank: number, isCurrentPlayer: boolean) => {
        const baseClasses = "transition-all duration-200";

        if (isCurrentPlayer) {
            return `${baseClasses} bg-primary/10 border-l-4 border-l-primary shadow-sm`;
        }

        switch (rank) {
            case 1:
                return `${baseClasses} bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent`;
            case 2:
                return `${baseClasses} bg-gradient-to-r from-slate-300/15 via-slate-300/5 to-transparent`;
            case 3:
                return `${baseClasses} bg-gradient-to-r from-amber-600/15 via-amber-600/5 to-transparent`;
            default:
                return `${baseClasses} hover:bg-muted/50`;
        }
    };

    const getRankBadge = (rank: number) => {
        switch (rank) {
            case 1:
                return (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                        <Crown className="h-4 w-4 text-white" />
                    </div>
                );
            case 2:
                return (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-400/30">
                        <Medal className="h-4 w-4 text-white" />
                    </div>
                );
            case 3:
                return (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Medal className="h-4 w-4 text-white" />
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-bold text-muted-foreground">{rank}</span>
                    </div>
                );
        }
    };

    const getScoreBarColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "from-yellow-400 to-yellow-500";
            case 2:
                return "from-slate-300 to-slate-400";
            case 3:
                return "from-amber-500 to-amber-600";
            default:
                return "from-primary/60 to-primary/80";
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {/* Header skeleton */}
                <div className="flex items-center justify-center gap-6 py-3 px-4 bg-muted/30 rounded-xl">
                    <div className="h-10 w-20 bg-muted rounded" />
                    <div className="h-8 w-px bg-muted" />
                    <div className="h-10 w-20 bg-muted rounded" />
                </div>
                {/* List skeleton */}
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                            <div className="h-8 w-8 rounded-full bg-muted" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-28 bg-muted rounded" />
                                <div className="h-1.5 w-full bg-muted rounded-full" />
                            </div>
                            <div className="h-4 w-12 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                    <Trophy className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No scores yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Be the first to play!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Stats */}
            <div className="flex items-center justify-center gap-6 py-3 px-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Top Score</p>
                        <p className="text-lg font-bold text-amber-500 tabular-nums leading-tight">{topScore}</p>
                    </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Players</p>
                        <p className="text-lg font-bold tabular-nums leading-tight">{leaderboard.length}</p>
                    </div>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="space-y-2">
                {leaderboard.map((entry) => {
                    const isCurrentPlayer = entry.playerId === currentPlayerId;
                    const scorePercentage = (entry.highScore / topScore) * 100;

                    return (
                        <div
                            key={entry.playerId}
                            className={`relative px-3 py-3 rounded-xl ${getRankStyle(entry.rank, isCurrentPlayer)}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Rank Badge */}
                                {getRankBadge(entry.rank)}

                                {/* Player Info & Score Bar */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className={`text-sm truncate ${isCurrentPlayer ? "font-bold" : "font-medium"}`}>
                                            {entry.playerName}
                                            {isCurrentPlayer && (
                                                <span className="ml-1.5 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                                    YOU
                                                </span>
                                            )}
                                        </p>
                                        <span className={`text-sm font-bold tabular-nums ml-2 ${entry.rank === 1 ? "text-yellow-500" :
                                            entry.rank === 2 ? "text-slate-400" :
                                                entry.rank === 3 ? "text-amber-600" :
                                                    "text-foreground"
                                            }`}>
                                            {entry.highScore.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Score Bar */}
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${getScoreBarColor(entry.rank)} transition-all duration-700 ease-out`}
                                            style={{ width: `${scorePercentage}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
