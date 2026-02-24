"use client";

import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Select,
    SelectItem,
    Skeleton,
} from "@heroui/react";
import {
    Gift,
    Coins,
    Users,
    AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface LuckyWinner {
    pollId: string;
    playerId: string;
    playerName: string;
    username: string;
    imageUrl: string;
    tournamentId: string;
    tournamentName: string;
    ucSaved: number;
    seasonId: string;
    seasonName: string;
    date: string;
}

interface SeasonStat {
    id: string;
    name: string;
    count: number;
    uc: number;
}

interface LuckyVoterData {
    winners: LuckyWinner[];
    stats: {
        freeEntries: number;
        totalUCGiven: number;
        uniquePlayers: number;
    };
    bySeason: SeasonStat[];
}

export default function LuckyVoterPage() {
    const { data, isLoading, error } = useQuery<LuckyVoterData>({
        queryKey: ["lucky-voters"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/lucky-voters");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
    });

    const [selectedTournament, setSelectedTournament] = useState<string>("all");

    // Derive unique tournaments for the selector
    const tournaments = useMemo(() => {
        if (!data) return [];
        const seen = new Map<string, string>();
        for (const w of data.winners) {
            if (!seen.has(w.tournamentId)) {
                seen.set(w.tournamentId, w.tournamentName);
            }
        }
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [data]);

    // Filtered winners + stats
    const filteredWinners = useMemo(() => {
        if (!data) return [];
        if (selectedTournament === "all") return data.winners;
        return data.winners.filter((w) => w.tournamentId === selectedTournament);
    }, [data, selectedTournament]);

    const filteredStats = useMemo(() => {
        return {
            freeEntries: filteredWinners.length,
            totalUCGiven: filteredWinners.reduce((sum, w) => sum + w.ucSaved, 0),
            uniquePlayers: new Set(filteredWinners.map((w) => w.playerId)).size,
        };
    }, [filteredWinners]);

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                <Skeleton className="h-8 w-64 rounded-lg" />
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center gap-2 p-4 text-danger">
                <AlertCircle className="h-4 w-4" />
                <span>Failed to load lucky voter data</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                    <Gift className="h-5 w-5 text-success" />
                </div>
                <div>
                    <h1 className="text-lg font-bold">Lucky Voter Tracker</h1>
                    <p className="text-xs text-foreground/40">
                        Free entry winners per tournament
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                >
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-2 p-3 sm:gap-3 sm:p-4">
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 sm:flex">
                                <Gift className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-[10px] text-foreground/40 sm:text-xs">Free Entries</p>
                                <p className="text-lg font-bold sm:text-xl">{filteredStats.freeEntries}</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                >
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-2 p-3 sm:gap-3 sm:p-4">
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 sm:flex">
                                <Coins className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-[10px] text-foreground/40 sm:text-xs">UC Given</p>
                                <p className="text-lg font-bold text-success sm:text-xl">
                                    {filteredStats.totalUCGiven} UC
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-2 p-3 sm:gap-3 sm:p-4">
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:flex">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-foreground/40 sm:text-xs">Helped</p>
                                <p className="text-lg font-bold sm:text-xl">{filteredStats.uniquePlayers}</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* Tournament Filter */}
            <Select
                label="Tournament"
                selectedKeys={[selectedTournament]}
                onChange={(e) => setSelectedTournament(e.target.value || "all")}
                size="sm"
                className="max-w-xs"
                classNames={{ trigger: "border border-divider" }}
                variant="bordered"
            >
                {[
                    <SelectItem key="all">All Tournaments</SelectItem>,
                    ...tournaments.map((t) => (
                        <SelectItem key={t.id}>{t.name}</SelectItem>
                    )),
                ]}
            </Select>

            {/* All Lucky Winners */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Card className="border border-divider">
                    <CardHeader className="pb-2">
                        <h2 className="text-sm font-bold">All Lucky Winners</h2>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-divider text-foreground/40">
                                        <th className="px-1.5 py-2 text-left font-medium sm:px-4">Player</th>
                                        <th className="hidden px-4 py-2 text-left font-medium sm:table-cell">Tournament</th>
                                        <th className="px-1.5 py-2 text-center font-medium sm:px-4">UC Saved</th>
                                        <th className="px-1.5 py-2 text-right font-medium sm:px-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWinners.map((winner) => (
                                        <tr
                                            key={winner.pollId}
                                            className="border-b border-divider/50 transition-colors hover:bg-default-100/50"
                                        >
                                            <td className="px-1.5 py-2.5 sm:px-4 sm:py-3">
                                                <div className="max-w-[120px] truncate font-medium sm:max-w-none">{winner.playerName}</div>
                                                <div className="max-w-[120px] truncate text-[10px] text-foreground/40 sm:hidden">{winner.tournamentName}</div>
                                            </td>
                                            <td className="hidden px-4 py-3 text-foreground/60 sm:table-cell">
                                                {winner.tournamentName}
                                            </td>
                                            <td className="px-1.5 py-2.5 text-center sm:px-4 sm:py-3">
                                                <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-[10px] font-bold text-success sm:px-2 sm:text-xs">
                                                    🎁 {winner.ucSaved} UC
                                                </span>
                                            </td>
                                            <td className="px-1.5 py-2.5 text-right text-foreground/40 sm:px-4 sm:py-3">
                                                {new Date(winner.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            </motion.div>
        </div>
    );
}
