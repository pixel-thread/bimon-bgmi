"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardBody, Skeleton } from "@heroui/react";
import {
    Users,
    Trophy,
    Vote,
    Wallet,
    Gamepad2,
    ShieldBan,
    BarChart3,
    AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardStats {
    players: { total: number; banned: number };
    users: { total: number };
    tournaments: { active: number; total: number };
    polls: { active: number };
    economy: { totalBalance: number };
    matches: { recentGroups: number };
}

const statIconMap = {
    "Total Players": { icon: Users, color: "text-primary" },
    "Total Users": { icon: Users, color: "text-success" },
    "Active Tournaments": { icon: Trophy, color: "text-warning" },
    "Total Tournaments": { icon: Gamepad2, color: "text-foreground/60" },
    "Active Polls": { icon: Vote, color: "text-secondary" },
    "Total Economy": { icon: Wallet, color: "text-warning" },
    "Recent Matches": { icon: BarChart3, color: "text-primary" },
    "Banned Players": { icon: ShieldBan, color: "text-danger" },
};

/**
 * /dashboard — Admin overview with key stats.
 */
export default function DashboardPage() {
    const { data, isLoading, error } = useQuery<DashboardStats>({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/stats");
            if (!res.ok) throw new Error("Failed to fetch stats");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30 * 1000,
    });

    const statCards = data
        ? [
            {
                label: "Total Players",
                value: data.players.total.toLocaleString(),
            },
            {
                label: "Total Users",
                value: data.users.total.toLocaleString(),
            },
            {
                label: "Active Tournaments",
                value: data.tournaments.active.toString(),
            },
            {
                label: "Total Tournaments",
                value: data.tournaments.total.toLocaleString(),
            },
            {
                label: "Active Polls",
                value: data.polls.active.toString(),
            },
            {
                label: "Total Economy",
                value: `${data.economy.totalBalance.toLocaleString()} UC`,
            },
            {
                label: "Recent Matches",
                value: data.matches.recentGroups.toString(),
            },
            {
                label: "Banned Players",
                value: data.players.banned.toString(),
            },
        ]
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold">Dashboard</h1>
                <p className="text-sm text-foreground/50">
                    Overview of your PUBGMI community
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load dashboard stats.
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))
                    : statCards.map((stat, i) => {
                        const config =
                            statIconMap[stat.label as keyof typeof statIconMap];
                        const Icon = config?.icon ?? Users;
                        const color = config?.color ?? "text-default-400";

                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <Card className="border border-divider">
                                    <CardBody className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Icon className={`h-4 w-4 ${color}`} />
                                            <span className="text-xs text-foreground/50">
                                                {stat.label}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                                    </CardBody>
                                </Card>
                            </motion.div>
                        );
                    })}
            </div>
        </div>
    );
}
