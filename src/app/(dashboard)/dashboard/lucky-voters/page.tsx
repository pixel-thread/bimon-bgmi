"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
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
            <div className="grid grid-cols-3 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                >
                    <Card className="border border-divider">
                        <CardBody className="flex flex-row items-center gap-3 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
                                <Gift className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <p className="text-xs text-foreground/40">Free Entries</p>
                                <p className="text-xl font-bold">{data.stats.freeEntries}</p>
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
                        <CardBody className="flex flex-row items-center gap-3 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                                <Coins className="h-5 w-5 text-warning" />
                            </div>
                            <div>
                                <p className="text-xs text-foreground/40">UC Given Away</p>
                                <p className="text-xl font-bold text-success">
                                    {data.stats.totalUCGiven} UC
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
                        <CardBody className="flex flex-row items-center gap-3 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-foreground/40">Players Helped</p>
                                <p className="text-xl font-bold">{data.stats.uniquePlayers}</p>
                            </div>
                        </CardBody>
                    </Card>
                </motion.div>
            </div>

            {/* By Season */}
            {data.bySeason.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <Card className="border border-divider">
                        <CardHeader className="pb-2">
                            <h2 className="text-sm font-bold">By Season</h2>
                        </CardHeader>
                        <CardBody className="flex flex-row flex-wrap gap-2 pt-0">
                            {data.bySeason.map((season) => (
                                <div
                                    key={season.id}
                                    className="rounded-lg border border-divider bg-default-50 px-3 py-2"
                                >
                                    <p className="text-xs font-semibold">{season.name}</p>
                                    <p className="text-xs text-foreground/40">
                                        {season.count} winners{" "}
                                        <span className="ml-1 rounded bg-success/10 px-1.5 py-0.5 text-success">
                                            {season.uc} UC
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </CardBody>
                    </Card>
                </motion.div>
            )}

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
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-divider text-foreground/40">
                                        <th className="px-4 py-2 text-left font-medium">Player</th>
                                        <th className="px-4 py-2 text-left font-medium">Tournament</th>
                                        <th className="px-4 py-2 text-center font-medium">UC Saved</th>
                                        <th className="px-4 py-2 text-right font-medium">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.winners.map((winner) => (
                                        <tr
                                            key={winner.pollId}
                                            className="border-b border-divider/50 transition-colors hover:bg-default-100/50"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {winner.playerName}
                                            </td>
                                            <td className="px-4 py-3 text-foreground/60">
                                                {winner.tournamentName}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                                                    🎁 {winner.ucSaved} UC
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-foreground/40">
                                                {new Date(winner.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
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
