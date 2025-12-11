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
    User, Target, Skull, Swords, TrendingUp, Settings
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

type UCTransfer = {
    id: string;
    amount: number;
    type: "REQUEST" | "SEND";
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    message?: string;
    fromPlayerId: string;
    fromPlayer: { user: { userName: string } };
    toPlayerId: string;
    toPlayer: { user: { userName: string } };
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
    matches: Array<{ id: string }>;
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

    const playerStats = statsData?.data;
    const transfers = transfersData?.data || [];
    const notifications = notificationsData?.data?.notifications || [];
    const unreadCount = notificationsData?.data?.unreadCount || 0;

    // Calculate K/D ratio
    const kills = playerStats?.kills || 0;
    const deaths = playerStats?.deaths || 0;
    const matchesPlayed = playerStats?.matches?.length || 0;
    const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? kills.toFixed(2) : "0.00";

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

    // Show login message if no user at all
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Please log in to view your profile.
                    </CardContent>
                </Card>
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
                {profileImageUrl ? (
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
                    <h1 className="text-3xl font-bold">{user.userName}</h1>
                    <p className="text-muted-foreground">{user.email || "No email linked"}</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Account Settings
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-sm font-medium">UC Balance</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <p className="text-2xl font-bold">{userBalance}</p>
                                    <AddBalanceDialog />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                                    <Target className="w-4 h-4" />
                                    <span className="text-sm font-medium">Kills</span>
                                </div>
                                <p className="text-2xl font-bold">{statsLoading ? "..." : kills}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                                    <Skull className="w-4 h-4" />
                                    <span className="text-sm font-medium">Deaths</span>
                                </div>
                                <p className="text-2xl font-bold">{statsLoading ? "..." : deaths}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm font-medium">K/D Ratio</span>
                                </div>
                                <p className="text-2xl font-bold">{statsLoading ? "..." : kdRatio}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Additional Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Swords className="w-4 h-4" />
                                    <span className="text-sm font-medium">Matches Played</span>
                                </div>
                                <p className="text-2xl font-bold">{statsLoading ? "..." : matchesPlayed}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <span className="text-sm font-medium">Category</span>
                                </div>
                                <Badge variant="secondary" className="text-lg px-3 py-1">
                                    {user.player?.category || "NOOB"}
                                </Badge>
                            </CardContent>
                        </Card>
                        <Card className="col-span-2 md:col-span-1">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <span className="text-sm font-medium">Account Status</span>
                                </div>
                                {user.player?.isBanned ? (
                                    <Badge variant="destructive">Banned</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Requests Section */}
                    {pendingRequests.length > 0 && (
                        <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                    <Clock className="w-5 h-5" />
                                    Pending UC Requests ({pendingRequests.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pendingRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                <span className="text-blue-600">{request.fromPlayer.user.userName}</span>
                                                {" "}requested{" "}
                                                <span className="font-bold text-green-600">{request.amount} UC</span>
                                            </p>
                                            {request.message && (
                                                <p className="text-sm text-muted-foreground mt-1">&quot;{request.message}&quot;</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-green-600 text-green-600 hover:bg-green-50 disabled:opacity-50"
                                                onClick={() => {
                                                    if (userBalance < request.amount) {
                                                        toast.error(`Insufficient balance. You need ${request.amount} UC but have ${userBalance} UC.`);
                                                        return;
                                                    }
                                                    approveTransfer(request.id);
                                                }}
                                                disabled={isApproving || isRejecting || userBalance < request.amount}
                                            >
                                                <Check className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-red-600 text-red-600 hover:bg-red-50"
                                                onClick={() => rejectTransfer(request.id)}
                                                disabled={isApproving || isRejecting}
                                            >
                                                <X className="w-4 h-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Notifications Section */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Notifications
                                {unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                                )}
                            </CardTitle>
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => markAllRead()}>
                                    Mark all as read
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {notifications.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No notifications yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {notifications.slice(0, 5).map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 rounded-lg ${notification.isRead ? "bg-gray-50 dark:bg-gray-800" : "bg-blue-50 dark:bg-blue-900/20"}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{notification.title}</p>
                                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Transfer History */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Transfer History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transfers.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No transfers yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {transfers.slice(0, 10).map((transfer) => (
                                        <div
                                            key={transfer.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Determine if current user is losing or gaining UC */}
                                                {(() => {
                                                    // For SEND: fromPlayer loses money, toPlayer gains money
                                                    // For REQUEST (approved): fromPlayer gains money (requester), toPlayer loses money (payer)
                                                    const isLosingMoney = transfer.type === "SEND"
                                                        ? transfer.fromPlayerId === playerId  // Sender loses money
                                                        : transfer.toPlayerId === playerId;   // Payer loses money (when REQUEST is approved)

                                                    return isLosingMoney ? (
                                                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                                                    ) : (
                                                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                                                    );
                                                })()}
                                                <div>
                                                    <p className="font-medium">
                                                        {transfer.fromPlayerId === playerId ? (
                                                            <>
                                                                {transfer.type === "SEND" ? "Sent to" : "Requested from"}{" "}
                                                                <span className="text-blue-600">{transfer.toPlayer.user.userName}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {transfer.type === "SEND" ? "Received from" : "Request from"}{" "}
                                                                <span className="text-blue-600">{transfer.fromPlayer.user.userName}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(transfer.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {(() => {
                                                    const isLosingMoney = transfer.type === "SEND"
                                                        ? transfer.fromPlayerId === playerId
                                                        : transfer.toPlayerId === playerId;

                                                    return (
                                                        <span className={`font-bold ${isLosingMoney ? "text-red-600" : "text-green-600"}`}>
                                                            {isLosingMoney ? "-" : "+"}{transfer.amount} UC
                                                        </span>
                                                    );
                                                })()}
                                                {getStatusBadge(transfer.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Account Settings Tab */}
                <TabsContent value="account" className="mt-6">
                    <ProfileSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
