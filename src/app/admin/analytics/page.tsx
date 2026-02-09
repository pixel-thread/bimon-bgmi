"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Users,
    Gamepad2,
    Trophy,
    Swords,
    Shield,
    Bell,
    TrendingUp,
    TrendingDown,
    Coins,
    BarChart3,
    RefreshCw,
    Calendar,
    Gift,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/src/components/ui/chart";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useAuthContext } from "@/src/hooks/context/auth/useAuth";

type StatsResponse = {
    users: { total: number; onboarded: number };
    players: {
        total: number;
        active: number;
        banned: number;
        categories: {
            bot: number;
            ultraNoob: number;
            noob: number;
            pro: number;
            ultraPro: number;
            legend: number;
        };
    };
    tournaments: { total: number; active: number };
    matches: number;
    teams: number;
    economy: { totalUC: number; transactions: number; pendingTransfers: number };
    engagement: { pushSubscribers: number };
    income: number;
    prizePool: number;
    seasons: { total: number; active: number };
};

type GrowthResponse = {
    period: string;
    growth: {
        users: number;
        players: number;
        tournaments: number;
        matches: number;
        uc: number;
        subscribers: number;
    } | null;
    comparisonData: Array<{
        day: string;
        dayNum: number;
        currentUsers: number;
        currentPlayers: number;
        previousUsers: number;
        previousPlayers: number;
        currentDate: string | null;
        previousDate: string | null;
    }>;
    totals: {
        currentUsers: number;
        previousUsers: number;
        currentPlayers: number;
        previousPlayers: number;
        usersChange: number;
        playersChange: number;
    };
    summary: {
        totalUsers: number;
        totalPlayers: number;
        totalTournaments: number;
        totalMatches: number;
        totalUC: number;
        totalIncome: number;
    } | null;
};

const chartConfig: ChartConfig = {
    currentUsers: { label: "Users (This Period)", color: "#3b82f6" },
    previousUsers: { label: "Users (Previous)", color: "#f97316" },
};

// Gradient stat card with large percentage
function GradientStatCard({
    title,
    value,
    subtitle,
    gradient,
    icon: Icon,
    trend,
    loading,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    gradient: string;
    icon: React.ElementType;
    trend?: number;
    loading?: boolean;
}) {
    if (loading) {
        return (
            <div className="rounded-3xl p-6 h-40 bg-muted/50">
                <Skeleton className="h-4 w-20 mb-4" />
                <Skeleton className="h-12 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
            </div>
        );
    }

    return (
        <div
            className={`rounded-3xl p-6 h-40 relative overflow-hidden ${gradient} text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
        >
            <div className="absolute top-4 right-4 opacity-80">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium opacity-90 mb-2">{title}</p>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-bold tracking-tight">{value}</span>
                {trend !== undefined && trend !== 0 && (
                    <div className="flex items-center mb-1 text-sm opacity-90">
                        {trend > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                        ) : (
                            <TrendingDown className="h-3 w-3 mr-0.5" />
                        )}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            {subtitle && (
                <p className="text-xs opacity-75 mt-2">{subtitle}</p>
            )}
        </div>
    );
}

// Clean stat card for secondary stats
function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    loading,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ElementType;
    loading?: boolean;
}) {
    if (loading) {
        return (
            <div className="rounded-2xl p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-16" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground font-medium">{title}</p>
                <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </div>
            </div>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
        </div>
    );
}

// Progress bar for category breakdown
function CategoryProgress({
    label,
    value,
    total,
    color,
}: {
    label: string;
    value: number;
    total: number;
    color: string;
}) {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-24 truncate">{label}</span>
            <div className="flex-1">
                <Progress value={percentage} className={`h-2 ${color}`} />
            </div>
            <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
            <span className="text-xs text-muted-foreground w-8 text-right">{value}</span>
        </div>
    );
}

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<"week" | "month" | "quarter" | "year" | "lifetime">("month");
    const [isRecording, setIsRecording] = useState(false);
    const { getToken, isSignedIn } = useAuth();
    const { user } = useAuthContext();

    // Helper to make authenticated fetch requests
    const fetchWithAuth = async <T,>(url: string): Promise<T | null> => {
        const token = await getToken({ template: "jwt" });
        if (!token) return null;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const result = await response.json();
        return result.data || result;
    };

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["analytics-stats"],
        queryFn: () => fetchWithAuth<StatsResponse>("/admin/analytics/stats"),
        enabled: isSignedIn && !!user,
    });

    const { data: growth, isLoading: growthLoading } = useQuery({
        queryKey: ["analytics-growth", period],
        queryFn: () => fetchWithAuth<GrowthResponse>(`/admin/analytics/growth?period=${period}`),
        enabled: isSignedIn && !!user,
    });

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const totalPlayers = stats?.players.total || 1;
    const categories = stats?.players.categories;

    const triggerSnapshot = async (silent = false) => {
        setIsRecording(true);
        try {
            const res = await fetch("/api/cron/record-daily-metrics");
            const data = await res.json();
            if (!silent) alert(data.message);
        } catch {
            if (!silent) alert("Failed to record snapshot");
        } finally {
            setIsRecording(false);
        }
    };

    // Auto-record on page visit (runs once per page load)
    const hasAutoRecorded = useRef(false);
    useEffect(() => {
        if (!hasAutoRecorded.current && isSignedIn && user) {
            hasAutoRecorded.current = true;
            triggerSnapshot(true); // Silent auto-record
        }
    }, [isSignedIn, user]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold">Analytics</h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-13">
                        Your platform overview for 2026
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerSnapshot(false)}
                        disabled={isRecording}
                        className="rounded-xl"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRecording ? "animate-spin" : ""}`} />
                        Record Now
                    </Button>
                    <Select
                        value={period}
                        onValueChange={(v) => setPeriod(v as typeof period)}
                    >
                        <SelectTrigger className="w-[140px] rounded-xl">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Last Week</SelectItem>
                            <SelectItem value="month">Last Month</SelectItem>
                            <SelectItem value="quarter">Last Quarter</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="lifetime">Lifetime</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Stats - Gradient Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <GradientStatCard
                    title="Total Users"
                    value={formatNumber(stats?.users.total || 0)}
                    subtitle={`${stats?.users.onboarded || 0} onboarded`}
                    gradient="bg-gradient-to-br from-orange-400 to-pink-500"
                    icon={Users}
                    trend={growth?.growth?.users}
                    loading={statsLoading}
                />
                <GradientStatCard
                    title="Prize Pool"
                    value={`₹${formatNumber(stats?.prizePool || 0)}`}
                    subtitle="Total distributed"
                    gradient="bg-gradient-to-br from-cyan-400 to-blue-500"
                    icon={Gift}
                    loading={statsLoading}
                />
                <GradientStatCard
                    title="UC in Circulation"
                    value={formatNumber(stats?.economy.totalUC || 0)}
                    subtitle={`${stats?.economy.transactions || 0} transactions`}
                    gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
                    icon={Coins}
                    trend={growth?.growth?.uc}
                    loading={statsLoading}
                />
                <GradientStatCard
                    title="Total Income"
                    value={`₹${formatNumber(stats?.income || 0)}`}
                    subtitle="Platform revenue"
                    gradient="bg-gradient-to-br from-violet-400 to-purple-500"
                    icon={TrendingUp}
                    loading={statsLoading}
                />
            </div>

            {/* Secondary Stats Row */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                <StatCard
                    title="Tournaments"
                    value={stats?.tournaments.total || 0}
                    subtitle={`${stats?.tournaments.active || 0} active`}
                    icon={Trophy}
                    loading={statsLoading}
                />
                <StatCard
                    title="Matches"
                    value={formatNumber(stats?.matches || 0)}
                    icon={Swords}
                    loading={statsLoading}
                />
                <StatCard
                    title="Teams"
                    value={formatNumber(stats?.teams || 0)}
                    icon={Shield}
                    loading={statsLoading}
                />
                <StatCard
                    title="Subscribers"
                    value={formatNumber(stats?.engagement.pushSubscribers || 0)}
                    icon={Bell}
                    loading={statsLoading}
                />
                <StatCard
                    title="Seasons"
                    value={stats?.seasons?.total || 0}
                    subtitle={`${stats?.seasons?.active || 0} active`}
                    icon={Calendar}
                    loading={statsLoading}
                />
            </div>

            {/* Charts and Breakdown */}
            <div className="grid gap-6 lg:grid-cols-3 min-w-0">
                {/* Growth Chart - Takes 2 columns */}
                <div className="lg:col-span-2 rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="font-semibold text-lg">New Signups Comparison</h3>
                            <p className="text-sm text-muted-foreground">
                                This {period} vs previous {period}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-muted-foreground">
                                    This {period} ({growth?.totals?.currentUsers || 0} users)
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-orange-500" />
                                <span className="text-muted-foreground">
                                    Last {period} ({growth?.totals?.previousUsers || 0} users)
                                </span>
                            </div>
                            {growth?.totals && growth.totals.usersChange !== 0 && (
                                <div className={`flex items-center font-medium ${growth.totals.usersChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {growth.totals.usersChange > 0 ? (
                                        <TrendingUp className="h-3 w-3 mr-0.5" />
                                    ) : (
                                        <TrendingDown className="h-3 w-3 mr-0.5" />
                                    )}
                                    {Math.abs(growth.totals.usersChange)}%
                                </div>
                            )}
                        </div>
                    </div>

                    {growthLoading ? (
                        <Skeleton className="h-[280px] w-full rounded-2xl" />
                    ) : growth?.comparisonData && growth.comparisonData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[280px] w-full">
                            <AreaChart data={growth.comparisonData}>
                                <defs>
                                    <linearGradient id="colorCurrentUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPreviousUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    className="text-muted-foreground"
                                />
                                <YAxis
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    className="text-muted-foreground"
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="currentUsers"
                                    name="This Period"
                                    stroke="#3b82f6"
                                    fill="url(#colorCurrentUsers)"
                                    strokeWidth={2.5}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="previousUsers"
                                    name="Previous Period"
                                    stroke="#f97316"
                                    fill="url(#colorPreviousUsers)"
                                    strokeWidth={2.5}
                                />
                            </AreaChart>
                        </ChartContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                            <div className="text-center">
                                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="font-medium">No data yet</p>
                                <p className="text-xs mt-1 opacity-75">Click &quot;Record Now&quot; to capture today&apos;s snapshot</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Player Categories - Right column */}
                <div className="rounded-3xl p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="mb-6">
                        <h3 className="font-semibold text-lg">Player Categories</h3>
                        <p className="text-sm text-muted-foreground">Skill distribution</p>
                    </div>

                    {statsLoading ? (
                        <div className="space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-6 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <CategoryProgress
                                label="Legend"
                                value={categories?.legend || 0}
                                total={totalPlayers}
                                color="[&>div]:bg-purple-500"
                            />
                            <CategoryProgress
                                label="Ultra Pro"
                                value={categories?.ultraPro || 0}
                                total={totalPlayers}
                                color="[&>div]:bg-blue-500"
                            />
                            <CategoryProgress
                                label="Pro"
                                value={categories?.pro || 0}
                                total={totalPlayers}
                                color="[&>div]:bg-green-500"
                            />
                            <CategoryProgress
                                label="Noob"
                                value={categories?.noob || 0}
                                total={totalPlayers}
                                color="[&>div]:bg-yellow-500"
                            />
                            <CategoryProgress
                                label="Ultra Noob"
                                value={categories?.ultraNoob || 0}
                                total={totalPlayers}
                                color="[&>div]:bg-orange-500"
                            />
                            <CategoryProgress
                                label="Bot"
                                value={categories?.bot || 0}
                                total={totalPlayers}
                                color="[&>div]:bg-red-500"
                            />
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Players</span>
                            <span className="font-bold text-lg">{stats?.players.total || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
