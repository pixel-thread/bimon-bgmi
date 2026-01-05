"use client";

import { useState, useEffect } from "react";
import { FiBell, FiRefreshCw, FiUser, FiClock, FiSmartphone } from "react-icons/fi";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Button } from "@/src/components/ui/button";

interface Subscriber {
    id: string;
    playerId: string;
    userName: string;
    displayName: string | null;
    createdAt: string;
    endpoint: string;
}

const AdminPushSubscribersPage = () => {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSubscribers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/push-subscribers");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setSubscribers(data.subscribers);
        } catch (err) {
            setError("Failed to fetch subscribers");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscribers();
    }, []);

    // Group subscribers by playerId to detect multiple devices
    const groupedByPlayer = subscribers.reduce((acc, sub) => {
        if (!acc[sub.playerId]) {
            acc[sub.playerId] = [];
        }
        acc[sub.playerId].push(sub);
        return acc;
    }, {} as Record<string, Subscriber[]>);

    const uniquePlayerCount = Object.keys(groupedByPlayer).length;

    // Calculate stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = subscribers.filter(
        (s) => new Date(s.createdAt) >= today
    ).length;

    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const weekCount = subscribers.filter(
        (s) => new Date(s.createdAt) >= thisWeek
    ).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8">
                {/* Header */}
                <header className="relative">
                    <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl" />
                    <div className="absolute top-0 right-20 w-24 h-24 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-2xl" />

                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border rounded-2xl shadow-lg">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="relative shrink-0">
                                <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/40 to-teal-500/40 rounded-xl blur opacity-60" />
                                <div className="relative p-2.5 sm:p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl">
                                    <FiBell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                                    Push Subscribers
                                </h1>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                    View who has enabled push notifications
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchSubscribers}
                            disabled={loading}
                            className="gap-2 w-full sm:w-auto"
                        >
                            <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-card/80 backdrop-blur-sm border rounded-xl">
                        <div className="text-2xl font-bold text-foreground">
                            {loading ? <Skeleton className="h-8 w-12" /> : subscribers.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Subscriptions</div>
                    </div>
                    <div className="p-4 bg-card/80 backdrop-blur-sm border rounded-xl">
                        <div className="text-2xl font-bold text-foreground">
                            {loading ? <Skeleton className="h-8 w-12" /> : uniquePlayerCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Unique Players</div>
                    </div>
                    <div className="p-4 bg-card/80 backdrop-blur-sm border rounded-xl">
                        <div className="text-2xl font-bold text-emerald-500">
                            {loading ? <Skeleton className="h-8 w-12" /> : todayCount}
                        </div>
                        <div className="text-sm text-muted-foreground">Today</div>
                    </div>
                    <div className="p-4 bg-card/80 backdrop-blur-sm border rounded-xl">
                        <div className="text-2xl font-bold text-teal-500">
                            {loading ? <Skeleton className="h-8 w-12" /> : weekCount}
                        </div>
                        <div className="text-sm text-muted-foreground">This Week</div>
                    </div>
                </div>

                {/* Subscribers List */}
                <div className="bg-card/80 backdrop-blur-sm border rounded-2xl overflow-hidden">
                    {error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : loading ? (
                        <div className="divide-y divide-border">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="p-4 flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-28" />
                                </div>
                            ))}
                        </div>
                    ) : subscribers.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <FiBell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No push notification subscribers yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {Object.entries(groupedByPlayer).map(([playerId, playerSubs], index) => {
                                // Sort by createdAt desc to get most recent first
                                const sortedSubs = [...playerSubs].sort(
                                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                );
                                const firstSub = sortedSubs[0];
                                const deviceCount = playerSubs.length;
                                const isMultiDevice = deviceCount > 1;

                                return (
                                    <div
                                        key={playerId}
                                        className="p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 font-semibold text-sm shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <FiUser className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="font-medium text-foreground truncate">
                                                            {firstSub.displayName || firstSub.userName}
                                                        </span>
                                                        {isMultiDevice && (
                                                            <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                                                                <FiSmartphone className="h-3 w-3" />
                                                                {deviceCount} devices
                                                            </span>
                                                        )}
                                                    </div>
                                                    {firstSub.displayName && (
                                                        <div className="text-sm text-muted-foreground truncate">
                                                            @{firstSub.userName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Device subscription timestamps */}
                                        <div className="mt-2 ml-11 sm:ml-14 space-y-1">
                                            {sortedSubs.map((sub, subIdx) => (
                                                <div
                                                    key={sub.id}
                                                    className="flex items-center gap-2 text-xs text-muted-foreground"
                                                >
                                                    <FiSmartphone className="h-3 w-3 shrink-0" />
                                                    <span className="text-muted-foreground/70">Device {subIdx + 1}:</span>
                                                    <FiClock className="h-3 w-3" />
                                                    {new Date(sub.createdAt).toLocaleString("en-IN", {
                                                        timeZone: "Asia/Kolkata",
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPushSubscribersPage;
