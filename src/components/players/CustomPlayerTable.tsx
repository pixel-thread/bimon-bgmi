"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { PlayerAvatar } from "@/src/components/ui/player-avatar";
import { Badge } from "@/src/components/ui/badge";
import { CategoryBadge } from "@/src/components/ui/category-badge";
import { MetaT } from "@/src/types/meta";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useMutation, useQueryClient, FetchNextPageOptions, InfiniteQueryObserverResult } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Crown, Medal, Award, TrendingUp, Target, Gamepad2, Coins, Star, Loader2 } from "lucide-react";
import { getDisplayName } from "@/src/utils/displayName";
import { motion, AnimatePresence } from "framer-motion";

type PlayerT = {
    id: string;
    isBanned: boolean;
    userName: string;
    displayName?: string | null;
    category: string;
    matches: number;
    kd: number;
    uc?: number;
    imageUrl?: string | null;
    profileImageUrl?: string | null;
    characterImageUrl?: string | null;
    kills?: number;
    hasRoyalPass?: boolean;
    isAnimated?: boolean;
    isVideo?: boolean;
    thumbnailUrl?: string | null;
};

interface CustomPlayerTableProps {
    data: PlayerT[];
    meta?: MetaT;
    sortBy: string;
    fetchNextPage: (options?: FetchNextPageOptions) => Promise<InfiniteQueryObserverResult>;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
}

// Position config for podium cards
const positionConfig = {
    1: {
        size: "w-24 sm:w-32 aspect-[9/16]",
        border: "border-2 border-yellow-400 dark:border-yellow-500",
        glow: "shadow-[0_0_25px_rgba(250,204,21,0.4)]",
        badge: "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900",
        bg: "from-yellow-100 via-amber-50 to-yellow-100 dark:from-yellow-900/40 dark:via-amber-900/30 dark:to-yellow-900/40",
    },
    2: {
        size: "w-20 sm:w-28 aspect-[9/16]",
        border: "border-2 border-gray-400 dark:border-gray-400",
        glow: "shadow-[0_0_15px_rgba(156,163,175,0.3)]",
        badge: "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
        bg: "from-gray-100 via-slate-50 to-gray-100 dark:from-gray-800/50 dark:via-slate-800/40 dark:to-gray-800/50",
    },
    3: {
        size: "w-20 sm:w-28 aspect-[9/16]",
        border: "border-2 border-amber-600 dark:border-amber-500",
        glow: "shadow-[0_0_15px_rgba(217,119,6,0.3)]",
        badge: "bg-gradient-to-br from-amber-600 to-orange-600 text-amber-100",
        bg: "from-amber-100 via-orange-50 to-amber-100 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-amber-900/40",
    },
} as const;

// Memoized PodiumCard component - prevents re-renders from recreating video elements
const PodiumCard = memo(function PodiumCard({
    player,
    position,
    onPlayerClick
}: {
    player: PlayerT;
    position: 1 | 2 | 3;
    onPlayerClick: (id: string) => void;
}) {
    const config = positionConfig[position];
    const kdValue = Number(player.kd || 0);
    const displayKd = isFinite(kdValue) ? kdValue.toFixed(2) : "0.00";

    // For animated content (GIF or video) - deferred loading
    const [mediaLoaded, setMediaLoaded] = useState(false);
    const [shouldLoadMedia, setShouldLoadMedia] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isVideo = player.isVideo;
    const isAnimated = player.isAnimated;
    const mediaUrl = (isAnimated || isVideo) ? (player.characterImageUrl || player.imageUrl) : null;

    // Defer media loading to not block initial render
    useEffect(() => {
        if (mediaUrl) {
            // Longer delay to prioritize data loading over media
            const deferTimer = setTimeout(() => {
                setShouldLoadMedia(true);
            }, 500);
            return () => clearTimeout(deferTimer);
        }
    }, [mediaUrl]);

    // Hover to replay video (only if paused/ended)
    const handleMouseEnter = useCallback(() => {
        if (videoRef.current && videoRef.current.paused) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(() => { });
        }
    }, []);

    return (
        <div
            onClick={() => onPlayerClick(player.id)}
            onMouseEnter={isVideo ? handleMouseEnter : undefined}
            className={`
                ${config.size} relative cursor-pointer group
                rounded-2xl ${config.border} ${config.glow}
                bg-gradient-to-b ${config.bg}
                overflow-hidden transition-all duration-200
                hover:scale-105 hover:shadow-xl
            `}
        >
            {/* Background image, video, or animated GIF */}
            {player.characterImageUrl || player.imageUrl ? (
                isVideo && mediaUrl ? (
                    // Video content - show thumbnail first, then video
                    <>
                        {/* Static thumbnail - shows immediately */}
                        <img
                            src={player.thumbnailUrl || player.characterImageUrl || player.imageUrl || ''}
                            alt=""
                            loading="lazy"
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mediaLoaded ? 'opacity-0' : 'opacity-90'}`}
                        />
                        {/* Video - plays once, replays on hover */}
                        {shouldLoadMedia && (
                            <video
                                ref={videoRef}
                                src={mediaUrl}
                                autoPlay
                                muted
                                playsInline
                                loop={false}
                                preload="none"
                                onLoadedData={() => setMediaLoaded(true)}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mediaLoaded ? 'opacity-90' : 'opacity-0'}`}
                                style={{ willChange: 'opacity' }}
                            />
                        )}
                    </>
                ) : isAnimated && mediaUrl ? (
                    // Animated GIF - show thumbnail first, swap to GIF when loaded
                    <>
                        {/* Static thumbnail - shows immediately, fades out when GIF loads */}
                        <img
                            src={player.thumbnailUrl || player.characterImageUrl || player.imageUrl || ''}
                            alt=""
                            loading="lazy"
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mediaLoaded ? 'opacity-0' : 'opacity-90'}`}
                        />
                        {/* Animated GIF - rendered hidden, becomes visible on load */}
                        {shouldLoadMedia && (
                            <img
                                src={mediaUrl}
                                alt=""
                                onLoad={() => setMediaLoaded(true)}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${mediaLoaded ? 'opacity-90' : 'opacity-0'}`}
                            />
                        )}
                    </>
                ) : (
                    // Static image
                    <img
                        src={player.characterImageUrl || player.imageUrl || ''}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />
                )
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl sm:text-6xl font-bold text-zinc-300 dark:text-zinc-600 opacity-50">
                        {getDisplayName(player.displayName, player.userName).charAt(0).toUpperCase()}
                    </span>
                </div>
            )}

            {/* Dark gradient overlay at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Position badge - top */}
            <div className={`absolute top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${config.badge}`}>
                #{position}
            </div>

            {/* Player info - bottom: Profile image centered, name below */}
            <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col items-center gap-1">
                {/* Centered circular profile image */}
                <div className="w-8 h-8 rounded-full border border-white/80 shadow-md overflow-hidden bg-slate-700">
                    {player.profileImageUrl ? (
                        <img
                            src={player.profileImageUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
                            <span className="text-[10px] font-bold text-white">
                                {getDisplayName(player.displayName, player.userName).charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
                {/* Name only */}
                <p className="text-[10px] sm:text-xs font-bold text-white truncate max-w-full px-1 drop-shadow-lg">
                    {getDisplayName(player.displayName, player.userName)}
                </p>
            </div>
        </div>
    );
});

export function CustomPlayerTable({
    data,
    meta,
    sortBy,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
}: CustomPlayerTableProps) {
    const { user } = useAuth();
    const search = useSearchParams();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Track whether to show spinner or button during fetch
    const [showSpinner, setShowSpinner] = useState(false);
    const spinnerTimerRef = useRef<NodeJS.Timeout | null>(null);
    const wasFetchingRef = useRef(false);

    // Track data length to reset animation for new players only
    const [previousDataLength, setPreviousDataLength] = useState(0);

    // Update previous data length when new data arrives
    useEffect(() => {
        if (!isFetchingNextPage && data.length > previousDataLength) {
            // Delay reset to allow animations to complete
            const timer = setTimeout(() => {
                setPreviousDataLength(data.length);
            }, 1500); // Wait for animations to finish
            return () => clearTimeout(timer);
        }
    }, [data.length, isFetchingNextPage, previousDataLength]);

    // When fetch starts, show button first, then spinner after 3 seconds
    useEffect(() => {
        if (isFetchingNextPage && !wasFetchingRef.current) {
            // Fetch just started - show button, set timer for spinner
            setShowSpinner(false);

            spinnerTimerRef.current = setTimeout(() => {
                setShowSpinner(true);
            }, 3000);
        }

        if (!isFetchingNextPage && wasFetchingRef.current) {
            // Fetch just completed - reset
            setShowSpinner(false);
            if (spinnerTimerRef.current) {
                clearTimeout(spinnerTimerRef.current);
            }
        }

        wasFetchingRef.current = isFetchingNextPage;

        return () => {
            if (spinnerTimerRef.current) {
                clearTimeout(spinnerTimerRef.current);
            }
        };
    }, [isFetchingNextPage]);

    // Skip to spinner immediately when button is clicked
    const handleLoadMoreClick = () => {
        if (spinnerTimerRef.current) {
            clearTimeout(spinnerTimerRef.current);
        }
        setShowSpinner(true);
    };

    // Intersection observer for infinite scroll (fetches in background)
    const loadMoreRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (!node) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                },
                { threshold: 0.1, rootMargin: "100px" }
            );

            observer.observe(node);

            return () => observer.disconnect();
        },
        [hasNextPage, isFetchingNextPage, fetchNextPage]
    );

    const { mutate: toggleBan } = useMutation({
        mutationFn: (playerId: string) =>
            http.post(
                ADMIN_PLAYER_ENDPOINTS.POST_TOGGLE_BANNED.replace(":id", playerId),
                {}
            ),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Player ban status updated");
                queryClient.invalidateQueries({ queryKey: ["players"] });
            } else {
                toast.error(data.message || "Failed to update ban status");
            }
        },
        onError: () => {
            toast.error("Failed to update ban status");
        },
    });

    const getDynamicHeader = () => {
        switch (sortBy) {
            case "kd": return { label: "K/D", icon: TrendingUp };
            case "kills": return { label: "Kills", icon: Target };
            case "matches": return { label: "Matches", icon: Gamepad2 };
            case "balance": return { label: "UC", icon: Coins };
            default: return { label: "K/D", icon: TrendingUp };
        }
    };

    const getKdColor = (category: string) => {
        const lowerCategory = category?.toLowerCase() || "";
        if (lowerCategory === "legend") return "text-purple-500";
        if (lowerCategory === "ultra pro") return "text-blue-500";
        if (lowerCategory === "pro") return "text-emerald-500";
        if (lowerCategory === "noob") return "text-yellow-500";
        if (lowerCategory === "ultra noob") return "text-orange-500";
        return "text-red-500";
    };

    const getBalanceColor = (balance: number) => {
        if (balance > 0) return "text-emerald-500";
        if (balance < 0) return "text-red-500";
        return "text-yellow-500";
    };

    const renderDynamicValue = (player: PlayerT) => {
        switch (sortBy) {
            case "kd":
                const kdValue = Number(player.kd || 0);
                const displayKd = isFinite(kdValue) ? kdValue.toFixed(2) : "0.00";
                return displayKd;
            case "kills":
                return player.kills || 0;
            case "matches":
                return player.matches;
            case "balance":
                return player.uc || 0;
            default:
                const defaultKdValue = Number(player.kd || 0);
                return isFinite(defaultKdValue) ? defaultKdValue.toFixed(2) : "0.00";
        }
    };

    const handleRowClick = (playerId: string) => {
        const params = new URLSearchParams(search.toString());
        params.set("player", playerId);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return {
            bg: "bg-gradient-to-r from-purple-500/20 via-violet-500/10 to-purple-500/20 dark:from-purple-500/30 dark:via-violet-500/20 dark:to-purple-500/30",
            border: "border-purple-500/50",
            badge: "bg-gradient-to-br from-purple-400 to-violet-500",
            icon: Star,
            glow: "shadow-[0_0_20px_rgba(139,92,246,0.3)]"
        };
        if (rank === 2) return {
            bg: "bg-gradient-to-r from-sky-200/30 via-slate-200/20 to-sky-200/30 dark:from-sky-400/20 dark:via-slate-400/10 dark:to-sky-400/20",
            border: "border-sky-400/50",
            badge: "bg-gradient-to-br from-sky-300 to-slate-400",
            icon: Medal,
            glow: "shadow-[0_0_15px_rgba(56,189,248,0.25)]"
        };
        if (rank === 3) return {
            bg: "bg-gradient-to-r from-orange-500/20 via-amber-600/10 to-orange-500/20 dark:from-orange-500/25 dark:via-amber-600/15 dark:to-orange-500/25",
            border: "border-orange-500/50",
            badge: "bg-gradient-to-br from-orange-400 to-amber-600",
            icon: Award,
            glow: "shadow-[0_0_15px_rgba(249,115,22,0.25)]"
        };
        return {
            bg: "bg-zinc-50 dark:bg-zinc-900/30",
            border: "border-zinc-200 dark:border-zinc-800",
            badge: "bg-zinc-100 dark:bg-zinc-800",
            icon: null,
            glow: ""
        };
    };

    const headerInfo = getDynamicHeader();
    const HeaderIcon = headerInfo.icon;

    // For infinite scroll, podium is always shown when we have at least 3 players
    const hasEnoughForPodium = data && data.length >= 3;
    const top3Players = hasEnoughForPodium ? data.slice(0, 3) : [];
    const remainingPlayers = hasEnoughForPodium ? data.slice(3) : data;

    return (
        <div className="w-full space-y-3">
            {/* Header - Leaderboard info */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium">Leaderboard</span>
                    {meta && (
                        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                            {meta.total} players
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <HeaderIcon className="w-3.5 h-3.5" />
                    <span>Sorted by {headerInfo.label}</span>
                </div>
            </div>

            {/* Top 3 Podium */}
            {hasEnoughForPodium && top3Players.length >= 3 && (
                <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/80 dark:to-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 sm:p-6">
                    <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                        <span className="font-bold text-base sm:text-lg text-zinc-800 dark:text-zinc-100">Top Players</span>
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    </div>
                    <div className="flex items-end justify-center gap-2 sm:gap-6">
                        {/* 2nd place - left */}
                        <motion.div
                            className="mb-0"
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                        >
                            <PodiumCard player={top3Players[1]} position={2} onPlayerClick={handleRowClick} />
                        </motion.div>
                        {/* 1st place - center, elevated */}
                        <motion.div
                            className="mb-2 sm:mb-4"
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        >
                            <PodiumCard player={top3Players[0]} position={1} onPlayerClick={handleRowClick} />
                        </motion.div>
                        {/* 3rd place - right */}
                        <motion.div
                            className="mb-0"
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
                        >
                            <PodiumCard player={top3Players[2]} position={3} onPlayerClick={handleRowClick} />
                        </motion.div>
                    </div>
                </div>
            )}

            {/* Players List */}
            <div className="space-y-2">
                {remainingPlayers?.length === 0 && top3Players?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Gamepad2 className="w-8 h-8 text-zinc-400" />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No players found</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    remainingPlayers?.flatMap((player: PlayerT, index: number) => {
                        // For infinite scroll, index is straightforward since we skip top 3 for podium
                        const globalIndex = index + 4; // +4 because we're after the top 3
                        const rankStyle = getRankStyle(globalIndex);
                        const RankIcon = rankStyle.icon;

                        // Calculate animation delay - only for new players
                        // previousDataLength tracks already-animated items, so offset by that minus the podium (3)
                        const animationOffset = Math.max(0, previousDataLength - 3);
                        const relativeIndex = index - animationOffset;
                        const isNewPlayer = relativeIndex >= 0;
                        const animationDelay = isNewPlayer ? relativeIndex * 0.1 : 0;

                        const playerRow = (
                            <motion.div
                                key={player.id}
                                initial={isNewPlayer ? { opacity: 0, y: 20 } : false}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: animationDelay,
                                    ease: "easeOut"
                                }}
                                onClick={() => handleRowClick(player.id)}
                                className={`
                                    group relative cursor-pointer rounded-xl border p-3 sm:p-4
                                    transition-all duration-200 ease-out
                                    hover:scale-[1.01] hover:shadow-lg
                                    active:scale-[0.99]
                                    ${player.hasRoyalPass
                                        ? 'bg-gradient-to-r from-amber-400/25 via-yellow-300/20 to-amber-400/25 border-amber-500/60 dark:from-amber-500/35 dark:via-yellow-500/25 dark:to-amber-500/35 dark:border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                        : `${rankStyle.bg} ${rankStyle.border} ${rankStyle.glow}`
                                    }
                                    ${player.isBanned ? 'opacity-50 grayscale' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    {/* Rank Badge */}
                                    <div className={`
                                        w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                                        ${rankStyle.badge} shrink-0
                                        ${globalIndex <= 3 ? 'text-white shadow-md' : 'text-zinc-600 dark:text-zinc-300'}
                                    `}>
                                        {RankIcon ? (
                                            <RankIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                        ) : (
                                            <span className="text-sm sm:text-base font-bold">{globalIndex}</span>
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <PlayerAvatar
                                        profileImageUrl={player.profileImageUrl}
                                        imageUrl={player.imageUrl}
                                        displayName={player.displayName}
                                        userName={player.userName}
                                        size="lg"
                                        isBanned={player.isBanned}
                                        className={`
                                            shrink-0 ring-2 ring-offset-2
                                            ${globalIndex === 1 ? 'ring-purple-500 ring-offset-purple-500/20' :
                                                globalIndex === 2 ? 'ring-slate-400 ring-offset-slate-400/20' :
                                                    globalIndex === 3 ? 'ring-orange-500 ring-offset-orange-500/20' :
                                                        'ring-zinc-200 dark:ring-zinc-700 ring-offset-transparent'}
                                            dark:ring-offset-zinc-900
                                        `}
                                    />

                                    {/* Player Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm sm:text-base">
                                                {getDisplayName(player.displayName, player.userName)}
                                            </span>
                                            {player.hasRoyalPass && (
                                                <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                                            )}
                                            {player.isBanned && (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                    Banned
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="mt-1">
                                            <CategoryBadge category={player.category} size="xs" />
                                        </div>
                                    </div>

                                    {/* Stat Value */}
                                    <div className="text-right shrink-0">
                                        <div className={`text-lg sm:text-xl font-bold ${sortBy === "balance"
                                            ? getBalanceColor(player.uc || 0)
                                            : getKdColor(player.category)
                                            }`}>
                                            {renderDynamicValue(player)}
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                                            {headerInfo.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Arrow Indicator */}
                                <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                                </div>
                            </motion.div>
                        );

                        return playerRow;
                    })
                )}
            </div>

            {/* Infinite Scroll Load More */}
            <div ref={loadMoreRef} className="py-6 flex flex-col items-center justify-center gap-3">
                {isFetchingNextPage ? (
                    showSpinner ? (
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading more players...</span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadMoreClick}
                            className="px-6"
                        >
                            Load More
                        </Button>
                    )
                ) : hasNextPage ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Scroll for more</p>
                ) : data.length > 0 ? (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Showing all {meta?.total || data.length} players
                    </p>
                ) : null}
            </div>
        </div>
    );
}
