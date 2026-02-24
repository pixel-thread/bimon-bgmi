"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    Select,
    SelectItem,
    Skeleton,
} from "@heroui/react";
import {
    Users,
    Trophy,
    Vote,
    Wallet,
    Gamepad2,
    ShieldBan,
    BarChart3,
    AlertCircle,
    UsersRound,
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardStats {
    players: { total: number; banned: number };
    users: { total: number };
    tournaments: { active: number; total: number };
    polls: { active: number };
    economy: { totalBalance: number };
    matches: { total: number };
    teams: { avgPerTournament: number } | undefined;
}

interface Season {
    id: string;
    name: string;
}

/**
 * /dashboard — Admin overview with key stats.
 */
export default function DashboardPage() {
    const [selectedSeason, setSelectedSeason] = useState<string>("");

    // Fetch seasons
    const { data: seasons } = useQuery<Season[]>({
        queryKey: ["seasons"],
        queryFn: async () => {
            const res = await fetch("/api/seasons");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data;
        },
    });

    useEffect(() => {
        if (seasons && seasons.length > 0 && !selectedSeason) {
            setSelectedSeason(seasons[0].id);
        }
    }, [seasons, selectedSeason]);

    const { data, isLoading, error } = useQuery<DashboardStats>({
        queryKey: ["dashboard-stats", selectedSeason],
        queryFn: async () => {
            const url = selectedSeason
                ? `/api/dashboard/stats?seasonId=${selectedSeason}`
                : "/api/dashboard/stats";
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch stats");
            const json = await res.json();
            return json.data;
        },
        enabled: !!selectedSeason,
        staleTime: 30 * 1000,
    });

    return (
        <div className="space-y-5 p-4">
            {/* Header + Season */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-bold">Dashboard</h1>
                    <p className="text-xs text-foreground/40">
                        Overview of your PUBGMI community
                    </p>
                </div>
                {seasons && seasons.length > 0 && (
                    <Select
                        size="sm"
                        selectedKeys={selectedSeason ? [selectedSeason] : []}
                        onSelectionChange={(keys) => {
                            const val = Array.from(keys)[0] as string;
                            if (val) setSelectedSeason(val);
                        }}
                        className="w-44"
                        aria-label="Select season"
                    >
                        {seasons.map((s) => (
                            <SelectItem key={s.id}>{s.name}</SelectItem>
                        ))}
                    </Select>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load dashboard stats.
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            ) : data ? (
                <>
                    {/* Primary stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: "Total Players", value: data.players.total.toLocaleString(), icon: Users, color: "text-primary" },
                            { label: "Tournaments", value: data.tournaments.total.toLocaleString(), icon: Gamepad2, color: "text-warning" },
                            { label: "Avg Players / Tourney", value: (data.teams?.avgPerTournament ?? 0).toString(), icon: UsersRound, color: "text-secondary" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card className="border border-divider">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-2">
                                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                            <span className="text-xs text-foreground/50">{stat.label}</span>
                                        </div>
                                        <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Secondary stats */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Active Tournaments", value: data.tournaments.active.toString(), icon: Trophy, color: "text-warning" },
                            { label: "Active Polls", value: data.polls.active.toString(), icon: Vote, color: "text-secondary" },
                            { label: "Total Matches", value: data.matches.total.toLocaleString(), icon: BarChart3, color: "text-primary" },
                            { label: "Banned Players", value: data.players.banned.toString(), icon: ShieldBan, color: "text-danger" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.12 + i * 0.03 }}
                            >
                                <Card className="border border-divider">
                                    <CardBody className="flex-row items-center gap-3 p-3">
                                        <stat.icon className={`h-4 w-4 shrink-0 ${stat.color}`} />
                                        <div>
                                            <p className="text-xs text-foreground/50">{stat.label}</p>
                                            <p className="text-lg font-bold">{stat.value}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </>
            ) : null}
        </div>
    );
}
