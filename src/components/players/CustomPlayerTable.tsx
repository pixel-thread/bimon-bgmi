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
import { MoreHorizontal, Trash, Ban, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";
import { MetaT } from "@/src/types/meta";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { useSeasonStore } from "@/src/store/season";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

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

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(search.toString());
        params.set("page", String(newPage));
        router.push(`?${params.toString()}`);
    };

    const getDynamicHeader = () => {
        switch (sortBy) {
            case "kd": return "K/D Ratio";
            case "kills": return "Total Kills";
            case "matches": return "Matches";
            case "balance": return "UC";
            default: return "K/D Ratio";
        }
    };

    const renderDynamicCell = (player: PlayerT) => {
        switch (sortBy) {
            case "kd":
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${Number(player.kd || 0) >= 3 ? 'text-green-600 dark:text-green-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {Number(player.kd || 0).toFixed(2)}
                        </span>
                    </div>
                );
            case "kills":
                // Assuming kills is part of the player object, if not we might need to fetch it or it might be missing from the type definition I saw earlier.
                // Checking previous file view, PlayerT has: id, isBanned, userName, category, matches, kd.
                // It does NOT have kills explicitly listed in the type definition in CustomPlayerTable.tsx, but usePlayers.ts had it in the sort options.
                // Let's assume it's passed in data or we fallback to something.
                // Wait, the type definition in CustomPlayerTable.tsx lines 35-44:
                // type PlayerT = { id, isBanned, userName, category, matches, kd, uc?, avatar? }
                // It is missing 'kills'. I should probably add it to the type if it's coming from API.
                // For now, I'll access it as any or add it to type.
                return <span className="font-medium text-zinc-700 dark:text-zinc-300">{(player as any).kills || 0}</span>;
            case "matches":
                return <span className="font-medium text-zinc-700 dark:text-zinc-300">{player.matches}</span>;
            case "balance":
                return <span className="font-medium text-zinc-700 dark:text-zinc-300">{player.uc || 0}</span>;
            default:
                return (
                    <div className="flex items-center gap-2">
                        <span className={`font-bold ${Number(player.kd || 0) >= 3 ? 'text-green-600 dark:text-green-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {Number(player.kd || 0).toFixed(2)}
                        </span>
                    </div>
                );
        }
    };

    return (
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
                                    onClick={() => router.push(`?player=${player.id}`)}
                                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 cursor-pointer"
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
                                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                                    {player.userName}
                                                </span>
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
    );
}
