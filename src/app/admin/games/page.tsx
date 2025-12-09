"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
    Trophy,
    Medal,
    Crown,
    RotateCcw,
    Gamepad2,
    Users,
    Star,
    Brain,
    Target,
    Zap,
    Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { LoaderFive } from "@/src/components/ui/loader";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/src/components/ui/tabs";

interface LeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    highScore: number;
    lastPlayedAt: string;
}

interface GameInfo {
    id: string;
    name: string;
    icon: React.ReactNode;
    status: "active" | "coming_soon";
}

const GAMES: GameInfo[] = [
    {
        id: "memory",
        name: "Memory Match",
        icon: <Brain className="h-4 w-4" />,
        status: "active",
    },
    {
        id: "flappy",
        name: "Flappy BGMI",
        icon: <Target className="h-4 w-4" />,
        status: "coming_soon",
    },
    {
        id: "snake",
        name: "Snake Rush",
        icon: <Zap className="h-4 w-4" />,
        status: "coming_soon",
    },
];

export default function AdminGamesPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isResetting, setIsResetting] = useState(false);
    const [selectedGame, setSelectedGame] = useState("memory");

    const fetchLeaderboard = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/admin/games");
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard);
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            toast.error("Failed to load leaderboard");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const handleResetLeaderboard = async () => {
        try {
            setIsResetting(true);
            const res = await fetch("/api/admin/games", {
                method: "DELETE",
            });
            if (res.ok) {
                toast.success("Leaderboard has been reset");
                setLeaderboard([]);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to reset leaderboard");
            }
        } catch (error) {
            console.error("Error resetting leaderboard:", error);
            toast.error("Failed to reset leaderboard");
        } finally {
            setIsResetting(false);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-5 w-5 text-yellow-500" />;
            case 2:
                return <Medal className="h-5 w-5 text-slate-400" />;
            case 3:
                return <Medal className="h-5 w-5 text-amber-600" />;
            default:
                return (
                    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {rank}
                    </span>
                );
        }
    };

    const getRankBg = (rank: number) => {
        switch (rank) {
            case 1:
                return "bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/20";
            case 2:
                return "bg-gradient-to-r from-slate-400/10 to-slate-500/5 border-slate-400/20";
            case 3:
                return "bg-gradient-to-r from-amber-600/10 to-orange-500/5 border-amber-600/20";
            default:
                return "hover:bg-muted/50";
        }
    };

    const activeGames = GAMES.filter((g) => g.status === "active");
    const comingSoonGames = GAMES.filter((g) => g.status === "coming_soon");

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
                        <Gamepad2 className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Games Management</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage game leaderboards and settings
                        </p>
                    </div>
                </div>
            </div>

            {/* Games Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Gamepad2 className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Active Games</p>
                            <p className="text-2xl font-bold text-blue-500">
                                {activeGames.length}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Clock className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Coming Soon</p>
                            <p className="text-2xl font-bold text-purple-500">
                                {comingSoonGames.length}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Users className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Total Players</p>
                            <p className="text-2xl font-bold text-emerald-500">
                                {leaderboard.length}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Trophy className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Top Score</p>
                            <p className="text-2xl font-bold text-amber-500">
                                {leaderboard[0]?.highScore ?? "-"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Games Tabs */}
            <Tabs value={selectedGame} onValueChange={setSelectedGame}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <TabsList>
                        {GAMES.map((game) => (
                            <TabsTrigger
                                key={game.id}
                                value={game.id}
                                disabled={game.status === "coming_soon"}
                                className="gap-2"
                            >
                                {game.icon}
                                {game.name}
                                {game.status === "coming_soon" && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5">
                                        Soon
                                    </Badge>
                                )}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                disabled={leaderboard.length === 0 || isResetting}
                            >
                                <RotateCcw className="h-4 w-4" />
                                Reset Leaderboard
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reset Leaderboard?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all game scores for{" "}
                                    {GAMES.find((g) => g.id === selectedGame)?.name}. This action
                                    cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleResetLeaderboard}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Yes, Reset All Scores
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Memory Game Tab */}
                <TabsContent value="memory" className="mt-6">
                    <Card>
                        <CardHeader className="border-b">
                            <div className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-indigo-500" />
                                <CardTitle>Memory Match Leaderboard</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex justify-center py-12">
                                    <LoaderFive text="Loading leaderboard..." />
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p>No scores yet</p>
                                    <p className="text-xs mt-1">
                                        Players need to complete the memory game to appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {leaderboard.map((entry) => (
                                        <div
                                            key={entry.playerId}
                                            className={`p-4 flex items-center gap-4 transition-colors ${getRankBg(
                                                entry.rank
                                            )}`}
                                        >
                                            <div className="flex items-center justify-center w-8">
                                                {getRankIcon(entry.rank)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {entry.playerName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Last played:{" "}
                                                    {new Date(entry.lastPlayedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-base font-bold px-3"
                                                >
                                                    {entry.highScore}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    points
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Flappy Game Tab (Coming Soon) */}
                <TabsContent value="flappy" className="mt-6">
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Flappy BGMI</p>
                            <p className="text-sm">Coming Soon</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Snake Game Tab (Coming Soon) */}
                <TabsContent value="snake" className="mt-6">
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Zap className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">Snake Rush</p>
                            <p className="text-sm">Coming Soon</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
