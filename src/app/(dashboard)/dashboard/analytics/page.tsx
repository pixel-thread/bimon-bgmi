"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Divider,
    Skeleton,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    BarChart3,
    TrendingUp,
    Users,
    Trophy,
    Wallet,
    Gamepad2,
    AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";

interface DashboardStats {
    players: { total: number; banned: number };
    users: { total: number };
    tournaments: { active: number; total: number };
    polls: { active: number };
    economy: { totalBalance: number };
    matches: { total: number };
}

/**
 * /dashboard/analytics — Detailed analytics view.
 * Uses the same stats API for now, with room to expand to growth charts later.
 */
export default function AnalyticsPage() {
    const { data, isLoading, error } = useQuery<DashboardStats>({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/stats");
            if (!res.ok) throw new Error("Failed to fetch");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    if (error) {
        return (
            <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                <AlertCircle className="h-4 w-4" />
                Failed to load analytics.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Analytics</h1>
                <p className="text-sm text-foreground/50">
                    Community growth and engagement metrics
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading
                    ? [1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-36 rounded-xl" />
                    ))
                    : data && (
                        <>
                            {/* Players overview */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border border-divider">
                                    <CardHeader className="gap-2 pb-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold">Players</h3>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody className="space-y-3 pt-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-3xl font-bold">
                                                {data.players.total}
                                            </span>
                                            <span className="text-xs text-foreground/40">
                                                total players
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-default-100 px-3 py-1.5 text-xs">
                                            <span className="text-foreground/50">
                                                Active
                                            </span>
                                            <span className="font-semibold text-success">
                                                {data.players.total - data.players.banned}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-danger-50/50 px-3 py-1.5 text-xs dark:bg-danger-50/10">
                                            <span className="text-foreground/50">
                                                Banned
                                            </span>
                                            <span className="font-semibold text-danger">
                                                {data.players.banned}
                                            </span>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>

                            {/* Tournaments overview */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <Card className="border border-divider">
                                    <CardHeader className="gap-2 pb-2">
                                        <Trophy className="h-4 w-4 text-warning" />
                                        <h3 className="text-sm font-semibold">Tournaments</h3>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody className="space-y-3 pt-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-3xl font-bold">
                                                {data.tournaments.total}
                                            </span>
                                            <span className="text-xs text-foreground/40">
                                                total tournaments
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-success-50/50 px-3 py-1.5 text-xs dark:bg-success-50/10">
                                            <span className="text-foreground/50">Active</span>
                                            <span className="font-semibold text-success">
                                                {data.tournaments.active}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-default-100 px-3 py-1.5 text-xs">
                                            <span className="text-foreground/50">
                                                Active Polls
                                            </span>
                                            <span className="font-semibold">
                                                {data.polls.active}
                                            </span>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>

                            {/* Economy overview */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <Card className="border border-divider">
                                    <CardHeader className="gap-2 pb-2">
                                        <Wallet className="h-4 w-4 text-success" />
                                        <h3 className="text-sm font-semibold">Economy</h3>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody className="space-y-3 pt-3">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-3xl font-bold">
                                                {data.economy.totalBalance.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-foreground/40">
                                                total UC
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-default-100 px-3 py-1.5 text-xs">
                                            <span className="text-foreground/50">
                                                Users
                                            </span>
                                            <span className="font-semibold">
                                                {data.users.total}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg bg-default-100 px-3 py-1.5 text-xs">
                                            <span className="text-foreground/50">
                                                Recent Match Groups
                                            </span>
                                            <span className="font-semibold">
                                                {data.matches.total}
                                            </span>
                                        </div>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        </>
                    )}
            </div>

            {/* Growth charts placeholder */}
            <Card className="border border-divider">
                <CardHeader className="gap-2 pb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Growth Over Time</h3>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <BarChart3 className="h-12 w-12 text-foreground/10" />
                        <p className="text-sm text-foreground/40">
                            Growth charts will be integrated with the DailyMetrics cron system
                        </p>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
