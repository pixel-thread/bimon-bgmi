"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardBody, Input, Divider, Avatar } from "@heroui/react";
import { Gamepad2, Trophy, RotateCcw, Banknote, AlertCircle } from "lucide-react";
import { CurrencyIcon } from "@/components/common/CurrencyIcon";

interface LeaderboardEntry {
    rank: number;
    score: number;
    moves: number;
    time: number;
    displayName: string;
    imageUrl: string | null;
    playerId: string;
}

export default function AdminGamesPage() {
    const queryClient = useQueryClient();
    const [reward1, setReward1] = useState("");
    const [reward2, setReward2] = useState("");
    const [reward3, setReward3] = useState("");

    // Fetch settings
    const { data: settings } = useQuery({
        queryKey: ["admin-games"],
        queryFn: async () => {
            const res = await fetch("/api/admin/games");
            return res.json();
        },
    });

    // Fetch leaderboard
    const { data: leaderboard } = useQuery({
        queryKey: ["admin-games-lb"],
        queryFn: async () => {
            const res = await fetch("/api/games/leaderboard");
            return res.json();
        },
    });

    // Sync reward inputs when settings load
    useEffect(() => {
        if (settings?.rewards) {
            setReward1(settings.rewards["1"]?.toString() || "");
            setReward2(settings.rewards["2"]?.toString() || "");
            setReward3(settings.rewards["3"]?.toString() || "");
        }
    }, [settings]);

    const updateRewards = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "updateRewards",
                    rewards: { "1": parseInt(reward1) || 0, "2": parseInt(reward2) || 0, "3": parseInt(reward3) || 0 },
                }),
            });
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-games"] }),
    });

    const resetScores = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "resetScores" }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-games"] });
            queryClient.invalidateQueries({ queryKey: ["admin-games-lb"] });
        },
    });

    const distributeRewards = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/admin/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "distributeRewards" }),
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.distributed?.length) {
                alert(`Distributed rewards to ${data.distributed.length} players!`);
            }
            queryClient.invalidateQueries({ queryKey: ["admin-games"] });
        },
    });

    const scores: LeaderboardEntry[] = leaderboard?.scores || [];

    return (
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
            <div>
                <div className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Games Management</h1>
                </div>
                <p className="text-sm text-foreground/50">
                    Configure rewards and manage the memory game leaderboard ({settings?.scoreCount ?? 0} players)
                </p>
            </div>

            {/* Rewards */}
            <Card className="border border-divider">
                <CardBody className="space-y-4 p-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <h2 className="text-sm font-semibold">UC Rewards</h2>
                    </div>
                    <p className="text-xs text-foreground/50">
                        Set UC prizes for top scores. Click &quot;Distribute&quot; to credit wallets.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <Input label="🥇 1st" type="number" size="sm" value={reward1} onValueChange={setReward1} endContent={<CurrencyIcon size={14} />} />
                        <Input label="🥈 2nd" type="number" size="sm" value={reward2} onValueChange={setReward2} endContent={<CurrencyIcon size={14} />} />
                        <Input label="🥉 3rd" type="number" size="sm" value={reward3} onValueChange={setReward3} endContent={<CurrencyIcon size={14} />} />
                    </div>
                    <Button color="primary" size="sm" onPress={() => updateRewards.mutate()} isLoading={updateRewards.isPending}>
                        Save Rewards
                    </Button>
                </CardBody>
            </Card>

            <Divider />

            {/* Leaderboard */}
            <div className="space-y-4">
                <h2 className="text-sm font-semibold">Leaderboard</h2>

                {scores.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-default-100 py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-foreground/20" />
                        <p className="text-sm text-foreground/50">No scores yet</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 rounded-lg bg-default-100 px-4 py-2 text-xs font-semibold text-foreground/50">
                            <span className="w-8 text-center">#</span>
                            <span className="flex-1">Player</span>
                            <span className="w-14 text-right">Score</span>
                            <span className="w-12 text-right">Moves</span>
                            <span className="w-12 text-right">Time</span>
                        </div>
                        {scores.map((entry) => (
                            <div key={entry.playerId} className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${entry.rank <= 3 ? "bg-amber-500/10" : "hover:bg-default-100"}`}>
                                <span className={`w-8 text-center text-xs font-medium ${entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-foreground/50" : entry.rank === 3 ? "text-orange-400" : "text-foreground/30"}`}>
                                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                                </span>
                                <div className="flex flex-1 items-center gap-2 min-w-0">
                                    <Avatar src={entry.imageUrl || undefined} name={entry.displayName} size="sm" className="h-7 w-7 shrink-0" />
                                    <span className="text-sm font-medium truncate">{entry.displayName}</span>
                                </div>
                                <span className="w-14 text-right text-sm font-bold game-text">{entry.score}</span>
                                <span className="w-12 text-right text-xs text-foreground/60">{entry.moves}</span>
                                <span className="w-12 text-right text-xs text-foreground/60">{Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, "0")}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        color="success" variant="flat" size="sm"
                        onPress={() => distributeRewards.mutate()}
                        isLoading={distributeRewards.isPending}
                        isDisabled={scores.length === 0}
                        startContent={<Banknote className="h-4 w-4" />}
                    >
                        Distribute Rewards
                    </Button>
                    <Button
                        color="danger" variant="flat" size="sm"
                        onPress={() => { if (confirm("Reset ALL scores? This cannot be undone.")) resetScores.mutate(); }}
                        isLoading={resetScores.isPending}
                        startContent={<RotateCcw className="h-4 w-4" />}
                    >
                        Reset Scores
                    </Button>
                </div>
            </div>
        </div>
    );
}
