"use client";

import React, { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { MoreHorizontal, Trash, Ban, CheckCircle, Shield, DollarSign } from "lucide-react";
import Link from "next/link";
import { MetaT } from "@/src/types/meta";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { useSeasonStore } from "@/src/store/season";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { AdjustBalanceDialog } from "@/src/components/admin/players/AdjustBalanceDialog";

type PlayerT = {
    id: string;
    isBanned: boolean;
    userName: string;
    category: string;
    matches: number;
    kd: number;
    uc?: number;
    imageUrl?: string | null;
};

interface CustomPlayerTableProps {
    data: PlayerT[];
    meta?: MetaT;
}

export function CustomPlayerTable({ data, meta, sortBy }: CustomPlayerTableProps & { sortBy: string }) {
    const { user, isSuperAdmin } = useAuth();
    const search = useSearchParams();
    const page = search.get("page") || "1";
    const router = useRouter();
    const queryClient = useQueryClient();
    const [balanceDialog, setBalanceDialog] = useState<{
        open: boolean;
        playerId: string;
        playerName: string;
        currentBalance: number;
    }>({
        open: false,
        playerId: "",
        playerName: "",
        currentBalance: 0,
    });

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(search.toString());
        params.set("page", String(newPage));
        router.push(`?${params.toString()}`);
    };

    const { mutate: toggleBan, isPending: isBanPending } = useMutation({
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
            case "kd": return "K/D Ratio";
            case "kills": return "Total Kills";
            case "matches": return "Matches";
            case "balance": return "UC";
            default: return "K/D Ratio";
        }
    };

    const getKdColor = (category: string) => {
        const lowerCategory = category?.toLowerCase() || "";
        if (lowerCategory === "legend") return "text-purple-600 dark:text-purple-400";
        if (lowerCategory === "ultra pro") return "text-blue-600 dark:text-blue-400";
        if (lowerCategory === "pro") return "text-green-600 dark:text-green-400";
        if (lowerCategory === "noob") return "text-yellow-600 dark:text-yellow-400";
        if (lowerCategory === "ultra noob") return "text-orange-600 dark:text-orange-400";
        return "text-red-600 dark:text-red-400"; // Bot and others
    };

    const renderDynamicCell = (player: PlayerT) => {
        switch (sortBy) {
            case "kd":
                const kdValue = Number(player.kd || 0);
                const displayKd = isFinite(kdValue) ? kdValue.toFixed(2) : "N/A";
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${getKdColor(player.category)}`}>
                            {displayKd}
                        </span>
                    </div>
                );
            case "kills":
                return <span className="font-medium text-zinc-700 dark:text-zinc-300">{(player as any).kills || 0}</span>;
            case "matches":
                return <span className="font-medium text-zinc-700 dark:text-zinc-300">{player.matches}</span>;
            case "balance":
                const balance = player.uc || 0;
                return (
                    <span className={`font-medium ${balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {balance}
                    </span>
                );
            default:
                const defaultKdValue = Number(player.kd || 0);
                const defaultDisplayKd = isFinite(defaultKdValue) ? defaultKdValue.toFixed(2) : "N/A";
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${getKdColor(player.category)}`}>
                            {defaultDisplayKd}
                        </span>
                    </div>
                );
        }
    };

    const handleAdjustBalance = (player: PlayerT) => {
        setBalanceDialog({
            open: true,
            playerId: player.id,
            playerName: player.userName,
            currentBalance: player.uc || 0,
        });
    };

    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

    return (
        <>
            <div className="w-full bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                            <TableHead className="w-16 pl-6">#</TableHead>
                            <TableHead className="w-[300px]">Player</TableHead>
                            <TableHead>{getDynamicHeader()}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-zinc-500">
                                    No players found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.map((player, index) => {
                                const globalIndex = meta ? (meta.page - 1) * meta.pageSize + index + 1 : index + 1;
                                return (
                                    <TableRow
                                        key={player.id}
                                        onClick={() => {
                                            const params = new URLSearchParams(search.toString());
                                            params.set("player", player.id);
                                            router.push(`?${params.toString()}`);
                                        }}
                                        className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 cursor-pointer ${player.isBanned ? 'opacity-60' : ''}`}
                                    >
                                        <TableCell className="pl-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">
                                            {globalIndex}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-700">
                                                    <AvatarImage src={player.imageUrl || undefined} />
                                                    <AvatarFallback>{player.userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] sm:max-w-[180px]">
                                                            {player.userName}
                                                        </span>
                                                        {player.isBanned && (
                                                            <Badge variant="destructive" className="text-xs shrink-0">
                                                                Banned
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Badge variant="secondary" className="w-fit text-xs font-normal bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                                                        {player.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {renderDynamicCell(player)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {meta && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            Page {meta.page} of {meta.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Number(page) - 1)}
                                disabled={!meta.hasPreviousPage}
                                className="h-8"
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(Number(page) + 1)}
                                disabled={!meta.hasNextPage}
                                className="h-8"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
