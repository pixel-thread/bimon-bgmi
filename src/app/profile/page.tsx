"use client";
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProfileSettings } from "@/src/components/profile/ProfileSettings";
import { AddBalanceDialog } from "@/src/components/profile/AddBalanceDialog";
import {
    Bell, Check, X, ArrowUpRight, ArrowDownLeft, Clock, DollarSign,
    User, Target, Swords, TrendingUp, TrendingDown, Minus, Settings,
    Trophy, Calendar, Star, Medal, ShieldAlert, History, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { getDisplayName } from "@/src/utils/bgmiDisplay";
import { getKdRank } from "@/src/utils/categoryUtils";
import { CategoryBadge } from "@/src/components/ui/category-badge";

type UCTransfer = {
    id: string;
    amount: number;
    type: "REQUEST" | "SEND";
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    message?: string;
    fromPlayerId: string;
    fromPlayer: { user: { userName: string; displayName?: string | null } };
    toPlayerId: string;
    toPlayer: { user: { userName: string; displayName?: string | null } };
    createdAt: string;
};

type Notification = {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    link?: string;
    createdAt: string;
    requestMessage?: string; // Original message from the request
};

type BalanceHistoryItem = {
    id: string;
    playerId: string;
    amount: number;
    type: "credit" | "debit";
    description: string;
    timestamp: string;
};

type PlayerStats = {
    kills: number;
    deaths: number;
    kd: number;
    kdTrend: "up" | "down" | "same";
    kdChange: number;
    lastMatchKills: number;
    seasonsPlayed: number;
    totalTournaments: number;
    bestMatchKills: number;
    podiumFinishes: { first: number; second: number; third: number };
    banStatus: { isBanned: boolean; reason?: string; duration?: number; bannedAt?: Date };
    wins: number;
    top10Count: number;
    winRate: number;
    top10Rate: number;
    avgKillsPerMatch: number;
};

export default function ProfilePage() {
    const { user, isAuthLoading } = useAuth();
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const queryClient = useQueryClient();
    const playerId = user?.playerId;
    const userBalance = user?.player?.uc?.balance || 0;
    const profileImageUrl = clerkUser?.imageUrl;

    // Loading state
    const isPageLoading = isAuthLoading || !isClerkLoaded;

    // UC History expanded state (lazy load)
    const [showUCHistory, setShowUCHistory] = useState(false);
    const [ucHistoryPage, setUcHistoryPage] = useState(1);
    const UC_HISTORY_PAGE_SIZE = 10;

    // Check if displayName guide should be shown (no displayName set)
    const showDisplayNameGuide = !user?.displayName && !!user;

    // Fetch player stats
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["player-stats", playerId],
        queryFn: () => http.get<PlayerStats>(`/players/${playerId}/stats`),
        enabled: !!playerId,
    });

    // Fetch transfers
    const { data: transfersData } = useQuery({
        queryKey: ["uc-transfers"],
        queryFn: () => http.get<UCTransfer[]>("/uc-transfers"),
        enabled: !!playerId,
    });

    // Fetch notifications
    const { data: notificationsData } = useQuery({
        queryKey: ["notifications"],
        queryFn: () => http.get<{ notifications: Notification[]; unreadCount: number }>("/notifications"),
        enabled: !!playerId,
    });

    // Fetch balance history - only when UC History is expanded
    const { data: balanceHistoryData, isLoading: isBalanceHistoryLoading } = useQuery({
        queryKey: ["balance-history", playerId, ucHistoryPage],
        queryFn: () => http.get<{ transactions: BalanceHistoryItem[]; pagination: { total: number; pages: number; page: number } }>(`/players/${playerId}/transactions?page=${ucHistoryPage}&limit=${UC_HISTORY_PAGE_SIZE}`),
        enabled: !!playerId && showUCHistory, // Only fetch when section is expanded
    });

    // Fetch profile image settings
    const { data: imageSettingsData, isLoading: isImageSettingsLoading } = useQuery({
        queryKey: ["profile-image-settings"],
        queryFn: () => http.get<{
            imageType: "google" | "none" | "custom";
            customImage: { publicUrl: string } | null
        }>("/profile/image"),
        enabled: !!playerId,
    });

    const playerStats = statsData?.data;
    const transfers = transfersData?.data || [];
    const unreadCount = notificationsData?.data?.unreadCount || 0;

    const notifications = notificationsData?.data?.notifications || [];
    const imageSettings = imageSettingsData?.data;
    const balanceHistory = balanceHistoryData?.data?.transactions || [];
    const totalBalanceHistoryCount = balanceHistoryData?.data?.pagination?.total || 0;
    const ucHistoryTotalPages = balanceHistoryData?.data?.pagination?.pages || 1;

    // Compute basic stats from preloaded auth data (instant) or fallback to API data
    const preloadedStats = user?.player?.playerStats || [];
    const preloadedKills = preloadedStats.reduce((sum, s) => sum + s.kills, 0);
    const preloadedDeaths = preloadedStats.reduce((sum, s) => sum + s.deaths, 0);
    const preloadedKd = preloadedDeaths > 0 ? preloadedKills / preloadedDeaths : preloadedKills;

    // Use preloaded data for instant display, API data once loaded for accuracy
    const kills = playerStats?.kills ?? preloadedKills;
    const deaths = playerStats?.deaths ?? preloadedDeaths;
    const kd = playerStats?.kd ?? Number(preloadedKd.toFixed(2));

    // Extended stats only from API (require complex aggregations)
    const kdTrend = playerStats?.kdTrend || "same";
    const kdChange = playerStats?.kdChange || 0;
    const lastMatchKills = playerStats?.lastMatchKills || 0;
    const seasonsPlayed = playerStats?.seasonsPlayed || preloadedStats.length;
    const totalTournaments = playerStats?.totalTournaments || 0;
    const bestMatchKills = playerStats?.bestMatchKills || 0;
    const podiumFinishes = playerStats?.podiumFinishes || { first: 0, second: 0, third: 0 };
    const banStatus = playerStats?.banStatus || { isBanned: user?.player?.isBanned || false };
    const wins = playerStats?.wins || 0;
    const top10Count = playerStats?.top10Count || 0;
    const winRate = playerStats?.winRate || 0;
    const top10Rate = playerStats?.top10Rate || 0;
    const avgKillsPerMatch = playerStats?.avgKillsPerMatch || 0;

    // Filter pending requests where the current user needs to approve
    const pendingRequests = transfers.filter(
        (t) => t.status === "PENDING" && t.type === "REQUEST" && t.toPlayerId === playerId
    );

    // Approve mutation
    const { mutate: approveTransfer, isPending: isApproving } = useMutation({
        mutationFn: (id: string) => http.patch(`/uc-transfers/${id}/approve`, {}),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Transfer approved");
                queryClient.invalidateQueries({ queryKey: ["uc-transfers"] });
                queryClient.invalidateQueries({ queryKey: ["uc-transfers-pending-count"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
                queryClient.invalidateQueries({ queryKey: ["player"] });
            } else {
                toast.error(data.message || "Failed to approve");
            }
        },
        onError: () => toast.error("Failed to approve transfer"),
    });

    // Reject mutation
    const { mutate: rejectTransfer, isPending: isRejecting } = useMutation({
        mutationFn: (id: string) => http.patch(`/uc-transfers/${id}/reject`, {}),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Transfer rejected");
                queryClient.invalidateQueries({ queryKey: ["uc-transfers"] });
                queryClient.invalidateQueries({ queryKey: ["uc-transfers-pending-count"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
            } else {
                toast.error(data.message || "Failed to reject");
            }
        },
        onError: () => toast.error("Failed to reject transfer"),
    });

    // Mark all as read
    const { mutate: markAllRead, isPending: isMarkingAllRead } = useMutation({
        mutationFn: () => http.post("/notifications/read-all", {}),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case "APPROVED":
            case "COMPLETED":
                return <Badge variant="outline" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" /> Completed</Badge>;
            case "REJECTED":
                return <Badge variant="outline" className="bg-red-100 text-red-800"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Show skeleton while loading
    if (isPageLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-6">
                {/* Header skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>

                {/* Tabs skeleton */}
                <Skeleton className="h-10 w-full max-w-md rounded-xl" />

                {/* Stats Section - Glassmorphism skeleton */}
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 dark:from-violet-600/20 dark:via-purple-600/20 dark:to-fuchsia-600/20" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />

                    <div className="relative p-4 md:p-6 space-y-4">
                        {/* K/D Featured */}
                        <div className="text-center">
                            <Skeleton className="h-4 w-20 mx-auto mb-2" />
                            <Skeleton className="h-12 w-24 mx-auto" />
                        </div>

                        {/* Battle Stats */}
                        <div className="grid grid-cols-4 gap-3 text-center">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <Skeleton className="h-8 w-12 mx-auto" />
                                    <Skeleton className="h-3 w-14 mx-auto" />
                                </div>
                            ))}
                        </div>

                        {/* Performance */}
                        <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-slate-200/50 dark:border-slate-600/50">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <Skeleton className="h-6 w-10 mx-auto" />
                                    <Skeleton className="h-3 w-16 mx-auto" />
                                </div>
                            ))}
                        </div>

                        {/* Career */}
                        <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-slate-200/50 dark:border-slate-600/50">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-1">
                                    <Skeleton className="h-6 w-10 mx-auto" />
                                    <Skeleton className="h-3 w-16 mx-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notifications skeleton - Glassmorphism */}
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 dark:from-blue-600/15 dark:via-cyan-600/15 dark:to-teal-600/15" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />

                    <div className="relative p-4 md:p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-5 w-28" />
                        </div>
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/30 dark:bg-slate-800/30">
                                    <div className="flex items-start gap-2.5">
                                        <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* UC History skeleton - Glassmorphism */}
                <div className="relative rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-indigo-500/10 dark:from-purple-600/15 dark:via-violet-600/15 dark:to-indigo-600/15" />
                    <div className="absolute inset-0 backdrop-blur-3xl" />

                    <div className="relative p-4 md:p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-5 w-24" />
                            </div>
                            <Skeleton className="h-7 w-14 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show login message if no user at all - redirect to sign in
    if (!user) {
        // Show skeleton briefly while potential redirect happens
        return (
            <div className="container mx-auto px-4 py-8 space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>
        );
    }

    // Show message if user is not a player (no playerId)
    if (!playerId) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p>You are logged in as <strong>{user.userName}</strong> ({user.role})</p>
                        <p className="mt-2">Player features are only available for player accounts.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header with User Info */}
            <div className="flex items-center gap-4">
                {/* Profile Image - respects user's image selection */}
                <div className="relative">
                    {isImageSettingsLoading ? (
                        <Skeleton className="h-16 w-16 !rounded-full" />
                    ) : imageSettings?.imageType === "none" ? (
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                            {user.userName?.charAt(0).toUpperCase()}
                        </div>
                    ) : imageSettings?.imageType === "custom" && imageSettings.customImage ? (
                        <Image
                            src={imageSettings.customImage.publicUrl}
                            alt={user.userName || "Profile"}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-full object-cover"
                            loading="lazy"
                        />
                    ) : profileImageUrl ? (
                        <Image
                            src={profileImageUrl}
                            alt={user.userName || "Profile"}
                            width={64}
                            height={64}
                            className="h-16 w-16 rounded-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                            {user.userName?.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {/* Banned Stamp Overlay */}
                    {banStatus.isBanned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/40 rounded-full" />
                            <div className="relative rotate-[-20deg] bg-red-600 text-white text-xs font-bold px-3 py-1 rounded border-2 border-red-800 shadow-lg uppercase tracking-wider">
                                Banned
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{getDisplayName(user.displayName, user.userName)}</h1>
                    <p className="text-sm text-muted-foreground">@{user.userName}</p>
                    <p className="text-muted-foreground">{user.email || "No email linked"}</p>
                </div>
            </div>


            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:text-violet-600 data-[state=active]:dark:text-violet-400 data-[state=active]:shadow-md rounded-lg font-medium">
                        <User className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="account" className="relative flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:text-violet-600 data-[state=active]:dark:text-violet-400 data-[state=active]:shadow-md rounded-lg font-medium">
                        <Settings className="w-4 h-4" />
                        Account Settings
                        {showDisplayNameGuide && (
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-white dark:border-zinc-900"></span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-6">
                    {/* Stats Section - Glassmorphism */}
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 dark:from-violet-600/20 dark:via-purple-600/20 dark:to-fuchsia-600/20" />
                        <div className="absolute inset-0 backdrop-blur-3xl" />

                        <div className="relative p-4 md:p-6">
                            {/* K/D Featured Display with Category */}
                            <div className="text-center mb-4">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">K/D Ratio</p>
                                    {!statsLoading && (
                                        <CategoryBadge category={getKdRank(kills, deaths)} size="xs" />
                                    )}
                                </div>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                                        {kd.toFixed(2)}
                                    </span>
                                    {!statsLoading && deaths > 0 && (
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${kdTrend === "up"
                                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                            : kdTrend === "down"
                                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                                : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                                            }`}>
                                            {kdTrend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
                                            {kdTrend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
                                            {kdTrend === "same" && <Minus className="w-3.5 h-3.5" />}
                                            {kdChange > 0 ? "+" : ""}{kdChange.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                                {!statsLoading && lastMatchKills > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Last match: <span className="font-semibold text-foreground">{lastMatchKills} kills</span>
                                    </p>
                                )}
                            </div>

                            {/* Stats List - Enhanced styling */}
                            <div className="divide-y divide-slate-200/50 dark:divide-slate-600/50">
                                {/* Primary Stats Header */}
                                <div className="pb-3">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Battle Stats</p>
                                    <div className="grid grid-cols-4 gap-3 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-slate-800 dark:text-white">{deaths}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Matches</p>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{statsLoading ? <Skeleton className="h-7 w-10 inline-block" /> : wins}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Wins</p>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{statsLoading ? <Skeleton className="h-7 w-10 inline-block" /> : top10Count}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Top 10</p>
                                        </div>
                                        <div>
                                            <div className={`text-2xl font-bold ${kills > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>{kills}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Kills</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Rates */}
                                <div className="py-3">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Performance</p>
                                    <div className="grid grid-cols-3 gap-3 text-center">
                                        <div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-white">{statsLoading ? <Skeleton className="h-6 w-10 inline-block" /> : <>{winRate}<span className="text-sm text-slate-500 dark:text-slate-400">%</span></>}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Win Rate</p>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-slate-800 dark:text-white">{statsLoading ? <Skeleton className="h-6 w-10 inline-block" /> : <>{top10Rate}<span className="text-sm text-slate-500 dark:text-slate-400">%</span></>}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Top 10 Rate</p>
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{statsLoading ? <Skeleton className="h-6 w-10 inline-block" /> : bestMatchKills}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Most Kill</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Career & Balance */}
                                <div className="pt-3">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Career</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{statsLoading ? <Skeleton className="h-6 w-10 inline-block" /> : totalTournaments}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Tournaments</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{statsLoading ? <Skeleton className="h-6 w-10 inline-block" /> : seasonsPlayed}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Seasons</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <p className={`text-xl font-bold ${userBalance <= 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{userBalance}</p>
                                                <AddBalanceDialog />
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">UC Balance</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ban Status Warning */}
                    {banStatus.isBanned && (
                        <div className="relative rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-red-600/15 to-rose-500/20" />
                            <div className="absolute inset-0 backdrop-blur-3xl" />

                            <div className="relative p-4 md:p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                                        <ShieldAlert className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-red-600 dark:text-red-400">Account Restricted</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {banStatus.reason || "Your account has been temporarily restricted."}
                                            {banStatus.duration && banStatus.duration > 0 && (
                                                <span className="ml-1">Duration: {banStatus.duration} day{banStatus.duration > 1 ? "s" : ""}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications - Glassmorphism */}
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-teal-500/10 dark:from-blue-600/15 dark:via-cyan-600/15 dark:to-teal-600/15" />
                        <div className="absolute inset-0 backdrop-blur-3xl" />

                        <div className="relative p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                                        <Bell className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold">Notifications</h3>
                                    {unreadCount > 0 && <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>}
                                </div>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead()} disabled={isMarkingAllRead}>
                                        {isMarkingAllRead ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                        Mark all read
                                    </Button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6 text-sm">No notifications yet</p>
                            ) : notifications.filter(n => !n.isRead).length === 0 ? (
                                <p className="text-center text-muted-foreground py-6 text-sm">All caught up! 🎉</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.filter(n => !n.isRead).slice(0, 5).map((notification) => {
                                        // Find matching pending request for uc_request type
                                        const pendingRequest = notification.type === "uc_request"
                                            ? pendingRequests.find(r => notification.message.includes(r.amount.toString()))
                                            : null;

                                        return (
                                            <div key={notification.id} className={`p-3 rounded-xl backdrop-blur-sm border ${notification.isRead ? "bg-white/30 dark:bg-slate-800/30 border-white/10 dark:border-slate-700/30" : "bg-white/60 dark:bg-slate-800/60 border-white/30 dark:border-slate-700/50"}`}>
                                                {/* For notifications with action buttons, use stacked layout on mobile */}
                                                {notification.type === "uc_request" && pendingRequest ? (
                                                    <div className="space-y-2">
                                                        {/* Top row: icon + content + timestamp */}
                                                        <div className="flex items-start gap-2.5">
                                                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-500/10">
                                                                <Clock className="w-4 h-4 text-amber-500" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="font-medium text-sm">{notification.title}</p>
                                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                                                                {pendingRequest.message && (
                                                                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 italic">&quot;{pendingRequest.message}&quot;</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Bottom row: action buttons */}
                                                        <div className="flex gap-2 pl-9 sm:pl-9">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 flex-1 sm:flex-initial sm:px-4 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                                onClick={() => {
                                                                    if (userBalance < pendingRequest.amount) {
                                                                        toast.error(`Insufficient balance.`);
                                                                        return;
                                                                    }
                                                                    approveTransfer(pendingRequest.id);
                                                                }}
                                                                disabled={isApproving || isRejecting || userBalance < pendingRequest.amount}
                                                            >
                                                                <Check className="w-3.5 h-3.5 mr-1" />
                                                                Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 flex-1 sm:flex-initial sm:px-4 border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                                onClick={() => rejectTransfer(pendingRequest.id)}
                                                                disabled={isApproving || isRejecting}
                                                            >
                                                                <X className="w-3.5 h-3.5 mr-1" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Regular notification layout */
                                                    <div className="flex items-start gap-2.5">
                                                        {/* Type-specific icons */}
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === "uc_received" || notification.type === "uc_approved" || notification.type === "uc_request_approved"
                                                            ? "bg-emerald-500/10"
                                                            : notification.type === "uc_rejected" || notification.type === "uc_request_rejected"
                                                                ? "bg-red-500/10"
                                                                : notification.type === "uc_request_sent"
                                                                    ? "bg-purple-500/10"
                                                                    : "bg-amber-500/10"
                                                            }`}>
                                                            {notification.type === "uc_received" && <ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
                                                            {notification.type === "uc_request" && <Clock className="w-4 h-4 text-amber-500" />}
                                                            {(notification.type === "uc_approved" || notification.type === "uc_request_approved") && <Check className="w-4 h-4 text-emerald-500" />}
                                                            {(notification.type === "uc_rejected" || notification.type === "uc_request_rejected") && <X className="w-4 h-4 text-red-500" />}
                                                            {notification.type === "uc_request_sent" && <ArrowUpRight className="w-4 h-4 text-purple-500" />}
                                                            {!["uc_received", "uc_request", "uc_approved", "uc_rejected", "uc_request_sent", "uc_request_approved", "uc_request_rejected"].includes(notification.type) && <Bell className="w-4 h-4 text-blue-500" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="font-medium text-sm truncate">{notification.title}</p>
                                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                                            {notification.requestMessage && (
                                                                <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5 italic">&quot;{notification.requestMessage}&quot;</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Balance History - Glassmorphism (Collapsible) */}
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/10 to-indigo-500/10 dark:from-purple-600/15 dark:via-violet-600/15 dark:to-indigo-600/15" />
                        <div className="absolute inset-0 backdrop-blur-3xl" />

                        <div className="relative p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                                        <History className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold">UC History</h3>
                                    {showUCHistory && totalBalanceHistoryCount > 0 && (
                                        <span className="text-xs text-muted-foreground">({totalBalanceHistoryCount} total)</span>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => setShowUCHistory(!showUCHistory)}
                                >
                                    {showUCHistory ? "Hide" : "Show"}
                                </Button>
                            </div>

                            {!showUCHistory ? (
                                <p className="text-center text-muted-foreground py-4 text-sm">
                                    Click &quot;Show&quot; to view your UC transaction history
                                </p>
                            ) : isBalanceHistoryLoading ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                                            <Skeleton className="h-4 w-24 mb-2" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : balanceHistory.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6 text-sm">No UC history yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {(() => {
                                        // Calculate running balance for each transaction
                                        let runningBalance = userBalance;
                                        const transactionsWithBalance = balanceHistory.map((entry) => {
                                            const balanceAfter = runningBalance;
                                            if (entry.type === "credit") {
                                                runningBalance = runningBalance - entry.amount;
                                            } else {
                                                runningBalance = runningBalance + Math.abs(entry.amount);
                                            }
                                            return { ...entry, balanceAfter };
                                        });
                                        return transactionsWithBalance.map((entry) => (
                                            <div key={entry.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${entry.type === "credit" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                                                        {entry.type === "credit" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium break-words">{entry.description}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                                                                month: "short",
                                                                day: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 ml-2">
                                                    <span className={`font-bold text-sm ${entry.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                                                        {entry.type === "credit" ? "+" : "-"}{Math.abs(entry.amount).toFixed(0)} UC
                                                    </span>
                                                    <p className="text-[10px] text-muted-foreground">Bal: {entry.balanceAfter} UC</p>
                                                </div>
                                            </div>
                                        ));
                                    })()}

                                    {/* Pagination Controls */}
                                    {ucHistoryTotalPages > 1 && (
                                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/20 dark:border-slate-700/50">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-3 text-xs"
                                                onClick={() => setUcHistoryPage(p => Math.max(1, p - 1))}
                                                disabled={ucHistoryPage <= 1 || isBalanceHistoryLoading}
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                                Prev
                                            </Button>
                                            <span className="text-xs text-muted-foreground">
                                                Page {ucHistoryPage} of {ucHistoryTotalPages}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-3 text-xs"
                                                onClick={() => setUcHistoryPage(p => Math.min(ucHistoryTotalPages, p + 1))}
                                                disabled={ucHistoryPage >= ucHistoryTotalPages || isBalanceHistoryLoading}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* Account Settings Tab */}
                <TabsContent value="account" className="mt-6">
                    <ProfileSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
