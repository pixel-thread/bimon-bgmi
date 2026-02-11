"use client";
import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProfileSettings } from "@/src/components/profile/ProfileSettings";
import { ProfileImageSheet } from "@/src/components/profile/ProfileImageSheet";
import { AddBalanceDialog } from "@/src/components/profile/AddBalanceDialog";
import { JobListingManager } from "@/src/components/profile/JobListingManager";
import { PromoterTab } from "@/src/components/profile/PromoterTab";
import {
    Bell, Check, X, ArrowUpRight, ArrowDownLeft, Clock, DollarSign,
    User, Target, Swords, TrendingUp, TrendingDown, Minus, Settings,
    Trophy, Calendar, Star, Medal, ShieldAlert, History, ChevronLeft, ChevronRight, ChevronDown, Loader2, Gift, ArrowLeft, Crown, Lock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { getDisplayName } from "@/src/utils/displayName";
import { getKdRank } from "@/src/utils/categoryUtils";
import { CategoryBadge } from "@/src/components/ui/category-badge";
import Link from "next/link";
import { useRoyalPass } from "@/src/hooks/royal-pass/useRoyalPass";
import { useAppContext } from "@/src/hooks/context/useAppContext";
import { SeasonSelector } from "@/src/components/SeasonSelector";
import { useSeasonStore } from "@/src/store/season";

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
    ucPlacements: { first: number; second: number; third: number; fourth: number; fifth: number };
    banStatus: { isBanned: boolean; reason?: string; duration?: number; bannedAt?: Date };
    wins: number;
    top10Count: number;
    winRate: number;
    top10Rate: number;
    avgKillsPerMatch: number;
};

type ProfileImageSettings = {
    imageType: "google" | "custom" | "uploaded" | "none";
    customImageId: string | null;
    customImage: { publicUrl: string } | null;
    uploadedImageUrl: string | null;
};

export default function ProfilePage() {
    const { user, isAuthLoading } = useAuth();
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const queryClient = useQueryClient();
    const router = useRouter();
    const playerId = user?.playerId;
    const userBalance = user?.player?.uc?.balance || 0;

    // Loading state
    const isPageLoading = isAuthLoading || !isClerkLoaded;

    // Royal Pass status for Crown badge and character image lock
    const { hasRoyalPass, hasCurrentSeasonRoyalPass } = useRoyalPass();

    // Get active season for filtered stats (always show current season stats)
    const { activeSeason } = useAppContext();
    const { seasonId: selectedSeasonFromStore } = useSeasonStore();
    // Use selected season from store if available, otherwise use active season
    const selectedSeasonId = selectedSeasonFromStore || activeSeason?.id || "";

    // UC History expanded state (lazy load)
    const [showUCHistory, setShowUCHistory] = useState(false);
    const [showUCWinsBreakdown, setShowUCWinsBreakdown] = useState(false);
    const [ucHistoryPage, setUcHistoryPage] = useState(1);

    // Video ref for hover-to-replay on character image
    const charVideoRef = useRef<HTMLVideoElement>(null);
    const handleCharVideoHover = useCallback(() => {
        if (charVideoRef.current && charVideoRef.current.paused) {
            charVideoRef.current.currentTime = 0;
            charVideoRef.current.play().catch(() => { });
        }
    }, []);
    const UC_HISTORY_PAGE_SIZE = 10;

    // Track if promoter tab has been visited (to show "New" badge)
    const [hasVisitedPromoter, setHasVisitedPromoter] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("bimon_promoter_tab_visited") === "true";
        }
        return false;
    });

    const handlePromoterTabClick = () => {
        if (!hasVisitedPromoter) {
            setHasVisitedPromoter(true);
            localStorage.setItem("bimon_promoter_tab_visited", "true");
            // Dispatch custom event to notify Navigation component
            window.dispatchEvent(new Event("promoter-visited"));
        }
    };

    // Check if displayName guide should be shown (no displayName set)
    const showDisplayNameGuide = !user?.displayName && !!user;

    // Fetch player stats - filtered by selected season (empty = lifetime/all seasons)
    const statsSeasonParam = selectedSeasonId === "lifetime" ? "" : selectedSeasonId;
    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ["player-stats", playerId, statsSeasonParam],
        queryFn: () => http.get<PlayerStats>(`/players/${playerId}/stats?season=${statsSeasonParam}`),
        enabled: !!playerId && (selectedSeasonId === "lifetime" || !!selectedSeasonId),
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

    // Fetch balance history - only when UC History is expanded, filtered by season
    const { data: balanceHistoryData, isLoading: isBalanceHistoryLoading } = useQuery({
        queryKey: ["balance-history", playerId, ucHistoryPage, selectedSeasonId],
        queryFn: () => http.get<{ transactions: BalanceHistoryItem[]; pagination: { total: number; pages: number; page: number } }>(`/players/${playerId}/transactions?page=${ucHistoryPage}&limit=${UC_HISTORY_PAGE_SIZE}&season=${selectedSeasonId}`),
        enabled: !!playerId && showUCHistory, // Only fetch when section is expanded
    });



    // Fetch merit data
    const { data: meritData } = useQuery({
        queryKey: ["player-merit"],
        queryFn: () => http.get<{ merit: { score: number; isSoloRestricted: boolean } }>("/player/merit"),
        enabled: !!playerId,
    });

    // Fetch profile image settings for circular avatar
    const { data: profileImageData } = useQuery({
        queryKey: ["profile-image-settings"],
        queryFn: () => http.get<ProfileImageSettings>("/profile/image"),
        enabled: !!playerId,
    });
    const profileImageSettings = profileImageData?.data;

    // Fetch player bio
    const { data: bioData } = useQuery({
        queryKey: ["player-bio"],
        queryFn: () => http.get<{ bio: string | null; category: string }>("/profile/bio"),
        enabled: !!playerId,
    });
    const playerBio = bioData?.data?.bio;
    const playerCategory = bioData?.data?.category || "NOOB";
    const formatCategory = (cat: string) => cat.charAt(0) + cat.slice(1).toLowerCase();

    // Get current profile image URL based on settings
    // Profile image only uses google or uploaded - character image is separate
    const getProfileImageUrl = (): string | null => {
        if (!profileImageSettings) return clerkUser?.imageUrl || null;

        switch (profileImageSettings.imageType) {
            case "uploaded":
                return profileImageSettings.uploadedImageUrl || clerkUser?.imageUrl || null;
            case "google":
            default:
                return clerkUser?.imageUrl || null;
        }
    };
    const currentProfileImageUrl = getProfileImageUrl();

    const playerStats = statsData?.data;
    const transfers = transfersData?.data || [];
    const unreadCount = notificationsData?.data?.unreadCount || 0;

    const notifications = notificationsData?.data?.notifications || [];
    const balanceHistory = balanceHistoryData?.data?.transactions || [];
    const totalBalanceHistoryCount = balanceHistoryData?.data?.pagination?.total || 0;
    const ucHistoryTotalPages = balanceHistoryData?.data?.pagination?.pages || 1;

    // Compute basic stats from preloaded auth data (instant) or fallback to API data
    // Note: preloadedStats aggregates ALL seasons, so only use for lifetime view
    const preloadedStats = user?.player?.playerStats || [];
    const preloadedKills = preloadedStats.reduce((sum, s) => sum + s.kills, 0);
    const preloadedDeaths = preloadedStats.reduce((sum, s) => sum + s.deaths, 0);
    const preloadedKd = preloadedDeaths > 0 ? preloadedKills / preloadedDeaths : preloadedKills;

    // Determine if we're viewing lifetime stats
    const isLifetimeView = selectedSeasonId === "lifetime";

    // When a specific season is selected, don't use preloaded stats (they're lifetime aggregate)
    // Only use preloaded stats as fallback when viewing lifetime
    const usePreloadedStats = isLifetimeView && !playerStats;

    // When viewing a specific season, show zeros while loading or if no stats exist
    const kills = usePreloadedStats ? preloadedKills : (playerStats?.kills ?? 0);
    const deaths = usePreloadedStats ? preloadedDeaths : (playerStats?.deaths ?? 0);
    const kd = usePreloadedStats ? Number(preloadedKd.toFixed(2)) : (playerStats?.kd ?? 0);

    // Extended stats only from API (require complex aggregations)
    const kdTrend = playerStats?.kdTrend || "same";
    const kdChange = playerStats?.kdChange || 0;
    const lastMatchKills = playerStats?.lastMatchKills || 0;
    const seasonsPlayed = usePreloadedStats ? preloadedStats.length : (playerStats?.seasonsPlayed || 0);
    const totalTournaments = playerStats?.totalTournaments || 0;
    const bestMatchKills = playerStats?.bestMatchKills || 0;
    const podiumFinishes = playerStats?.podiumFinishes || { first: 0, second: 0, third: 0 };
    const ucPlacements = playerStats?.ucPlacements || { first: 0, second: 0, third: 0, fourth: 0, fifth: 0 };
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
                {/* Profile Header - 9:16 Card on LEFT, Info on RIGHT */}
                <div className="flex items-center gap-4">
                    {/* 9:16 Podium Card Skeleton */}
                    <div className="relative w-28 sm:w-36 aspect-[9/16] rounded-2xl border-[3px] border-yellow-400/50 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 overflow-hidden flex-shrink-0">
                        <Skeleton className="absolute inset-0" />
                        {/* Bottom info skeleton */}
                        <div className="absolute bottom-2 inset-x-1 flex flex-col items-center gap-1">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    {/* User Info Skeleton */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-8 w-40 sm:w-52" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-36" />
                    </div>
                </div>

                {/* Tabs skeleton */}
                <Skeleton className="h-11 w-full max-w-lg rounded-xl" />

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
                            {[...Array(2)].map((_, i) => (
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
            </div>
        );
    }

    // Show login message if no user at all - redirect to sign in
    if (!user) {
        // Show skeleton briefly while potential redirect happens
        return (
            <div className="container mx-auto px-4 py-8 space-y-6">
                <div className="flex items-center gap-4">
                    {/* 9:16 Card Skeleton */}
                    <div className="relative w-28 sm:w-36 aspect-[9/16] rounded-2xl border-[3px] border-yellow-400/50 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 overflow-hidden flex-shrink-0">
                        <Skeleton className="absolute inset-0" />
                    </div>
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
            {/* Back to Admin link for admin users */}
            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
            )}

            {/* Profile Header - Image on LEFT, Info on RIGHT */}
            <div className="flex items-center gap-4">
                {/* 9:16 Podium Preview - LEFT side */}
                <ProfileImageSheet userName={user.userName} displayName={user.displayName || undefined}>
                    <div
                        className="relative w-28 sm:w-36 aspect-[9/16] rounded-2xl border-[3px] border-yellow-400 dark:border-yellow-500 shadow-[0_0_25px_rgba(250,204,21,0.4)] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 overflow-hidden cursor-pointer group hover:scale-105 transition-transform flex-shrink-0"
                        onMouseEnter={user.player?.characterImage?.isVideo ? handleCharVideoHover : undefined}
                    >
                        {/* Character image/video or fallback gradient */}
                        {user.player?.characterImage?.publicUrl ? (
                            user.player?.characterImage?.isVideo ? (
                                // Video - use video tag with no loop for single playback, replays on hover
                                <video
                                    ref={charVideoRef}
                                    key={user.player.characterImage.publicUrl}
                                    src={user.player.characterImage.publicUrl}
                                    autoPlay
                                    muted
                                    playsInline
                                    loop={false}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    poster={user.player.characterImage.thumbnailUrl || undefined}
                                />
                            ) : user.player?.characterImage?.isAnimated ? (
                                // Animated GIF - use img tag
                                <img
                                    key={user.player.characterImage.publicUrl}
                                    src={user.player.characterImage.publicUrl}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ) : (
                                // Static image - use background-image
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${user.player.characterImage.publicUrl})` }}
                                />
                            )
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 via-slate-900 to-slate-950 flex items-center justify-center">
                                <span className="text-5xl sm:text-6xl font-bold text-white/20">
                                    {getDisplayName(user.displayName, user.userName).charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {/* Dark gradient overlay for bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

                        {/* Bottom: Profile image centered, name below - matching players page */}
                        <div className="absolute bottom-2 inset-x-1 flex flex-col items-center gap-1 px-1">
                            {/* Centered circular profile image */}
                            <div className="w-8 h-8 rounded-full border border-white/80 shadow-md overflow-hidden bg-slate-700">
                                {currentProfileImageUrl ? (
                                    <div
                                        className="w-full h-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${currentProfileImageUrl})` }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
                                        <span className="text-[10px] font-bold text-white">
                                            {getDisplayName(user.displayName, user.userName).charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Name only */}
                            <p className="text-[10px] sm:text-xs font-bold text-white truncate max-w-full drop-shadow-lg">
                                {getDisplayName(user.displayName, user.userName)}
                            </p>
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-white text-xs font-medium">Tap to edit</span>
                        </div>
                    </div>
                </ProfileImageSheet>

                {/* User Info - RIGHT side */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-bold truncate">{getDisplayName(user.displayName, user.userName)}</h1>
                        {hasRoyalPass && (
                            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 crown-glow flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.userName}</p>
                    <p className="text-sm text-muted-foreground italic">"{playerBio || `Nga u ${getDisplayName(user.displayName, user.userName)} dei u ${getKdRank(kills, deaths).charAt(0).toUpperCase() + getKdRank(kills, deaths).slice(1)}`}"</p>
                    <p className="text-sm text-muted-foreground truncate">{user.email || "No email linked"}</p>
                    {/* Banned status */}
                    {banStatus.isBanned && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/30">
                            <span className="text-xs font-medium text-red-600 dark:text-red-400">Banned</span>
                        </div>
                    )}
                </div>
            </div>


            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                    <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:text-violet-600 data-[state=active]:dark:text-violet-400 data-[state=active]:shadow-md rounded-lg font-medium">
                        <User className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:text-violet-600 data-[state=active]:dark:text-violet-400 data-[state=active]:shadow-md rounded-lg font-medium">
                        <Settings className="w-4 h-4" />
                        Settings
                    </TabsTrigger>
                    <TabsTrigger value="promoter" onClick={handlePromoterTabClick} className="relative flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:text-amber-600 data-[state=active]:dark:text-amber-400 data-[state=active]:shadow-md rounded-lg font-medium">
                        <Gift className="w-4 h-4" />
                        Promoter
                        {!hasVisitedPromoter && (
                            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-sm">
                                New
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Season Filter - Only on Overview tab */}
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-muted-foreground">Stats for:</span>
                        <SeasonSelector
                            className="w-auto min-w-[100px] h-7 text-xs border-0 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors [&>button]:border-0 [&>button]:bg-transparent [&>button]:font-medium [&>button]:text-violet-600 [&>button]:dark:text-violet-400"
                            placeholder="Season"
                            showLifetime
                        />
                    </div>
                    {/* Stats Section - Glassmorphism */}
                    <div className="relative rounded-2xl overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 dark:from-violet-600/20 dark:via-purple-600/20 dark:to-fuchsia-600/20" />
                        <div className="absolute inset-0 backdrop-blur-3xl" />

                        <div className="relative p-4 md:p-6">
                            {/* K/D Featured Display with Category - Centered */}
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
                                        <div
                                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg py-1 transition-colors"
                                            onClick={() => setShowUCWinsBreakdown(!showUCWinsBreakdown)}
                                        >
                                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                {statsLoading ? <Skeleton className="h-7 w-10 inline-block" /> : ucPlacements.first}
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase flex items-center justify-center gap-0.5">
                                                Wins <ChevronDown className={`w-3 h-3 transition-transform ${showUCWinsBreakdown ? 'rotate-180' : ''}`} />
                                            </p>
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

                                    {/* Expandable UC Wins Breakdown */}
                                    {showUCWinsBreakdown && (
                                        <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-600/50">
                                            {(ucPlacements.first + ucPlacements.second + ucPlacements.third + ucPlacements.fourth + ucPlacements.fifth) === 0 ? (
                                                <p className="text-center text-sm text-muted-foreground py-2">No UC wins yet</p>
                                            ) : (
                                                <div className="overflow-x-auto -mx-2 px-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                                    <div className="flex gap-4 min-w-max justify-center">
                                                        {ucPlacements.first > 0 && (
                                                            <div className="text-center min-w-[50px]">
                                                                <div className="text-lg font-bold text-yellow-500">
                                                                    <span className="text-base">🥇</span>{ucPlacements.first}
                                                                </div>
                                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">1st</p>
                                                            </div>
                                                        )}
                                                        {ucPlacements.second > 0 && (
                                                            <div className="text-center min-w-[50px]">
                                                                <div className="text-lg font-bold text-gray-400">
                                                                    <span className="text-base">🥈</span>{ucPlacements.second}
                                                                </div>
                                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">2nd</p>
                                                            </div>
                                                        )}
                                                        {ucPlacements.third > 0 && (
                                                            <div className="text-center min-w-[50px]">
                                                                <div className="text-lg font-bold text-orange-400">
                                                                    <span className="text-base">🥉</span>{ucPlacements.third}
                                                                </div>
                                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">3rd</p>
                                                            </div>
                                                        )}
                                                        {ucPlacements.fourth > 0 && (
                                                            <div className="text-center min-w-[50px]">
                                                                <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                                                                    <span className="text-[10px] font-bold">4th </span>{ucPlacements.fourth}
                                                                </div>
                                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">4th</p>
                                                            </div>
                                                        )}
                                                        {ucPlacements.fifth > 0 && (
                                                            <div className="text-center min-w-[50px]">
                                                                <div className="text-lg font-bold text-slate-500 dark:text-slate-400">
                                                                    <span className="text-[10px] font-bold">5th </span>{ucPlacements.fifth}
                                                                </div>
                                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">5th</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
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
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{statsLoading ? <Skeleton className="h-6 w-10 inline-block" /> : totalTournaments}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Tournaments</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{statsLoading ? <Skeleton className="h-6 w-10 inline-block" /> : seasonsPlayed}</div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Seasons</p>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-xl font-bold ${(meritData?.data?.merit?.score ?? 100) < 50 ? "text-red-600 dark:text-red-400" : (meritData?.data?.merit?.score ?? 100) >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                                {meritData?.data?.merit?.score ?? 100}%
                                            </div>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Merit</p>
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

                    {/* Job Listings Manager */}
                    <JobListingManager />

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

                {/* Promoter Tab */}
                <TabsContent value="promoter" className="mt-6">
                    <PromoterTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
