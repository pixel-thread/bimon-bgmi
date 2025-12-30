"use client";
import React from "react";
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
    User, Target, Swords, TrendingUp, TrendingDown, Minus, Settings
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
};

type PlayerStats = {
    kills: number;
    deaths: number;
    kd: number;
    kdTrend: "up" | "down" | "same";
    kdChange: number;
    lastMatchKills: number;
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

    // Fetch profile image settings
    const { data: imageSettingsData } = useQuery({
        queryKey: ["profile-image-settings"],
        queryFn: () => http.get<{
            imageType: "google" | "none" | "custom";
            customImage: { publicUrl: string } | null
        }>("/profile/image"),
        enabled: !!playerId,
    });

    const playerStats = statsData?.data;
    const transfers = transfersData?.data || [];
    const notifications = notificationsData?.data?.notifications || [];
    const unreadCount = notificationsData?.data?.unreadCount || 0;
    const imageSettings = imageSettingsData?.data;

    // Extract stats from API response
    const kills = playerStats?.kills || 0;
    const deaths = playerStats?.deaths || 0;
    const kd = playerStats?.kd || 0;
    const kdTrend = playerStats?.kdTrend || "same";
    const kdChange = playerStats?.kdChange || 0;
    const lastMatchKills = playerStats?.lastMatchKills || 0;

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
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
            } else {
                toast.error(data.message || "Failed to reject");
            }
        },
        onError: () => toast.error("Failed to reject transfer"),
    });

    // Mark all as read
    const { mutate: markAllRead } = useMutation({
        mutationFn: () => http.post("/notifications/read-all", {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
                <Skeleton className="h-10 w-full max-w-md" />

                {/* Stats grid skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-20 mb-2" />
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Additional stats skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Notifications skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </CardContent>
                </Card>
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
                {imageSettings?.imageType === "none" ? (
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
                    />
                ) : profileImageUrl ? (
                    <Image
                        src={profileImageUrl}
                        alt={user.userName || "Profile"}
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-full object-cover"
                    />
                ) : (
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                        {user.userName?.charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold">{getDisplayName(user.displayName, user.userName)}</h1>
                    <p className="text-sm text-muted-foreground">@{user.userName}</p>
                    <p className="text-muted-foreground">{user.email || "No email linked"}</p>
                </div>
            </div>


            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="account" className="relative flex items-center gap-2">
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
                                        {statsLoading ? "..." : kd.toFixed(2)}
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

                            {/* Stats Grid - 2 columns on mobile, 3 on larger */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center flex-shrink-0">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase">Kills</p>
                                        <p className="text-lg font-bold leading-tight">{statsLoading ? "..." : kills}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                                        <Swords className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase">Matches</p>
                                        <p className="text-lg font-bold leading-tight">{statsLoading ? "..." : deaths}</p>
                                    </div>
                                </div>
                                <div className="col-span-2 sm:col-span-1 flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase">UC Balance</p>
                                            <p className="text-lg font-bold leading-tight">{userBalance}</p>
                                        </div>
                                    </div>
                                    <AddBalanceDialog />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Requests - Glassmorphism */}
                    {pendingRequests.length > 0 && (
                        <div className="relative rounded-2xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/10 to-orange-500/10 dark:from-amber-600/15 dark:via-yellow-600/15 dark:to-orange-600/15" />
                            <div className="absolute inset-0 backdrop-blur-3xl" />

                            <div className="relative p-4 md:p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-semibold">Pending Requests ({pendingRequests.length})</h3>
                                </div>
                                <div className="space-y-2">
                                    {pendingRequests.map((request) => (
                                        <div key={request.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    <span className="text-violet-600 dark:text-violet-400">{getDisplayName(request.fromPlayer.user.displayName, request.fromPlayer.user.userName)}</span>
                                                    {" "}requested{" "}
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{request.amount} UC</span>
                                                </p>
                                                {request.message && <p className="text-xs text-muted-foreground mt-0.5">&quot;{request.message}&quot;</p>}
                                                <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <Button size="sm" variant="outline" className="h-8 px-2.5 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" onClick={() => { if (userBalance < request.amount) { toast.error(`Insufficient balance.`); return; } approveTransfer(request.id); }} disabled={isApproving || isRejecting || userBalance < request.amount}>
                                                    <Check className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="sm" variant="outline" className="h-8 px-2.5 border-red-500/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => rejectTransfer(request.id)} disabled={isApproving || isRejecting}>
                                                    <X className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
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
                                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead()}>Mark all read</Button>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6 text-sm">No notifications yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.slice(0, 5).map((notification) => (
                                        <div key={notification.id} className={`p-3 rounded-xl backdrop-blur-sm border ${notification.isRead ? "bg-white/30 dark:bg-slate-800/30 border-white/10 dark:border-slate-700/30" : "bg-white/60 dark:bg-slate-800/60 border-white/30 dark:border-slate-700/50"}`}>
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">{notification.title}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transfer History - Glassmorphism */}
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-green-500/10 to-teal-500/10 dark:from-emerald-600/15 dark:via-green-600/15 dark:to-teal-600/15" />
                        <div className="absolute inset-0 backdrop-blur-3xl" />

                        <div className="relative p-4 md:p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                                    <DollarSign className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="font-semibold">Transfer History</h3>
                            </div>
                            {transfers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-6 text-sm">No transfers yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {transfers.slice(0, 10).map((transfer) => {
                                        const isLosingMoney = transfer.type === "SEND" ? transfer.fromPlayerId === playerId : transfer.toPlayerId === playerId;
                                        return (
                                            <div key={transfer.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isLosingMoney ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
                                                        {isLosingMoney ? <ArrowUpRight className="w-4 h-4 text-red-500" /> : <ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {transfer.fromPlayerId === playerId ? (
                                                                <>{transfer.type === "SEND" ? "Sent to" : "Requested from"} <span className="text-violet-600 dark:text-violet-400">{getDisplayName(transfer.toPlayer.user.displayName, transfer.toPlayer.user.userName)}</span></>
                                                            ) : (
                                                                <>{transfer.type === "SEND" ? "Received from" : "Request from"} <span className="text-violet-600 dark:text-violet-400">{getDisplayName(transfer.fromPlayer.user.displayName, transfer.fromPlayer.user.userName)}</span></>
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true })}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-sm ${isLosingMoney ? "text-red-600" : "text-emerald-600"}`}>{isLosingMoney ? "-" : "+"}{transfer.amount} UC</span>
                                                    {getStatusBadge(transfer.status)}
                                                </div>
                                            </div>
                                        );
                                    })}
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
