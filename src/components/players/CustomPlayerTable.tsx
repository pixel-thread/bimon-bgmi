"use client";

import React from "react";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { CategoryBadge } from "@/src/components/ui/category-badge";
import { MetaT } from "@/src/types/meta";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Crown, Medal, Award, TrendingUp, Target, Gamepad2, Coins } from "lucide-react";
import { InFeedAd } from "@/src/components/ads/AdUnit";

type PlayerT = {
    id: string;
    isBanned: boolean;
    userName: string;
    category: string;
    matches: number;
    kd: number;
    uc?: number;
    imageUrl?: string | null;
    kills?: number;
};

interface CustomPlayerTableProps {
    data: PlayerT[];
    meta?: MetaT;
}

export function CustomPlayerTable({ data, meta, sortBy }: CustomPlayerTableProps & { sortBy: string }) {
    const { user } = useAuth();
    const search = useSearchParams();
    const page = search.get("page") || "1";
    const router = useRouter();
    const queryClient = useQueryClient();

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(search.toString());
        params.set("page", String(newPage));
        router.push(`?${params.toString()}`);
    };

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
        router.push(`?${params.toString()}`);
    };

    const getRankStyle = (rank: number) => {
        if (rank === 1) return {
            bg: "bg-gradient-to-r from-yellow-500/20 via-amber-500/10 to-yellow-500/20 dark:from-yellow-500/30 dark:via-amber-500/20 dark:to-yellow-500/30",
            border: "border-yellow-500/50",
            badge: "bg-gradient-to-br from-yellow-400 to-amber-500",
            icon: Crown,
            glow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]"
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

    return (
        <div className="w-full space-y-3">
            {/* Header */}
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

            {/* Players List */}
            <div className="space-y-2">
                {data?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                            <Gamepad2 className="w-8 h-8 text-zinc-400" />
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium">No players found</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    data?.flatMap((player, index) => {
                        const globalIndex = meta ? (meta.page - 1) * meta.pageSize + index + 1 : index + 1;
                        const rankStyle = getRankStyle(globalIndex);
                        const RankIcon = rankStyle.icon;

                        const playerRow = (
                            <div
                                key={player.id}
                                onClick={() => handleRowClick(player.id)}
                                className={`
                                    group relative cursor-pointer rounded-xl border p-3 sm:p-4
                                    transition-all duration-200 ease-out
                                    hover:scale-[1.01] hover:shadow-lg
                                    active:scale-[0.99]
                                    ${rankStyle.bg} ${rankStyle.border} ${rankStyle.glow}
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
                                    <Avatar className={`
                                        h-10 w-10 sm:h-12 sm:w-12 shrink-0 ring-2 ring-offset-2
                                        ${globalIndex === 1 ? 'ring-yellow-500 ring-offset-yellow-500/20' :
                                            globalIndex === 2 ? 'ring-slate-400 ring-offset-slate-400/20' :
                                                globalIndex === 3 ? 'ring-orange-500 ring-offset-orange-500/20' :
                                                    'ring-zinc-200 dark:ring-zinc-700 ring-offset-transparent'}
                                        dark:ring-offset-zinc-900
                                    `}>
                                        <AvatarImage src={player.imageUrl || undefined} />
                                        <AvatarFallback className="text-xs sm:text-sm font-semibold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                            {player.userName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Player Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm sm:text-base">
                                                {player.userName}
                                            </span>
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
                            </div>
                        );

                        // Insert ad row after 5th player (index 4)
                        if (index === 4) {
                            const adRow = (
                                <div
                                    key="ad-row-5"
                                    className="rounded-xl border p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800"
                                >
                                    <InFeedAd className="!min-h-0" />
                                </div>
                            );
                            return [playerRow, adRow];
                        }

                        return playerRow;
                    })
                )}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                        Page <span className="font-medium text-zinc-700 dark:text-zinc-300">{meta.page}</span> of{" "}
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{meta.totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(Number(page) - 1)}
                            disabled={!meta.hasPreviousPage}
                            className="h-8 w-8 p-0 sm:w-auto sm:px-3"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">Previous</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(Number(page) + 1)}
                            disabled={!meta.hasNextPage}
                            className="h-8 w-8 p-0 sm:w-auto sm:px-3"
                        >
                            <span className="hidden sm:inline mr-1">Next</span>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
