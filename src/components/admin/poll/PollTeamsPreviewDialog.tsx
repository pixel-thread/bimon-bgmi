"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Badge } from "@/src/components/ui/badge";
import { Loader2, AlertTriangle, Users, Coins } from "lucide-react";
import type { PreviewTeamsByPollsResult, TeamPreview } from "@/src/services/team/previewTeamsByPoll";

interface PollTeamsPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    previewData: PreviewTeamsByPollsResult | null;
    isLoading: boolean;
    isConfirming: boolean;
    onConfirm: () => void;
    teamSize: number;
}

function getKDColor(kd: number): string {
    if (kd >= 3) return "text-green-500";
    if (kd >= 2) return "text-blue-500";
    if (kd >= 1) return "text-yellow-500";
    return "text-red-500";
}

function getBalanceColor(balance: number, entryFee: number): string {
    if (balance >= entryFee * 2) return "text-green-500";
    if (balance >= entryFee) return "text-yellow-500";
    return "text-red-500";
}

function TeamCard({ team, entryFee }: { team: TeamPreview; entryFee: number }) {
    return (
        <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                    Team {team.teamNumber}
                </span>
                <Badge variant="outline" className="text-xs">
                    {team.players.length} player{team.players.length !== 1 ? "s" : ""}
                </Badge>
            </div>
            <ul className="space-y-2">
                {team.players.map((player) => (
                    <li
                        key={player.id}
                        className="flex flex-col gap-1 p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-700"
                    >
                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {player.userName}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className={getKDColor(player.kd)}>
                                K/D: {player.kd.toFixed(2)}
                            </span>
                            <span className={getBalanceColor(player.balance, entryFee)}>
                                <Coins className="inline w-3 h-3 mr-0.5" />
                                {player.balance} UC
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function PollTeamsPreviewDialog({
    open,
    onOpenChange,
    previewData,
    isLoading,
    isConfirming,
    onConfirm,
    teamSize,
}: PollTeamsPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] p-4 sm:p-6 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Preview Teams
                    </DialogTitle>
                    <DialogDescription className="text-sm text-gray-500">
                        Review the teams before confirming. UC will be debited upon confirmation.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <p className="text-gray-500">Generating team preview...</p>
                    </div>
                ) : previewData ? (
                    <>
                        {/* Summary Bar */}
                        <div className="flex flex-wrap gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <Badge variant="secondary" className="text-sm">
                                {previewData.tournamentName}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                {previewData.teams.length} Teams
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                {previewData.totalPlayersEligible} Players
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                Team Size: {teamSize}
                            </Badge>
                            {previewData.entryFee > 0 && (
                                <Badge className="bg-yellow-500 text-white text-sm">
                                    <Coins className="w-3 h-3 mr-1" />
                                    {previewData.entryFee} UC Entry Fee
                                </Badge>
                            )}
                        </div>

                        {/* Excluded Players Warning */}
                        {previewData.playersWithInsufficientBalance.length > 0 && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                        Players excluded due to insufficient UC:
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {previewData.playersWithInsufficientBalance
                                            .map((p) => `${p.userName} (${p.balance} UC)`)
                                            .join(", ")}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Teams Grid */}
                        <ScrollArea className="max-h-[50vh] border rounded-lg p-2 sm:p-4">
                            {previewData.teams.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {previewData.teams.map((team) => (
                                        <TeamCard
                                            key={team.teamNumber}
                                            team={team}
                                            entryFee={previewData.entryFee}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    No teams generated.
                                </p>
                            )}
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <AlertTriangle className="w-8 h-8 text-yellow-500" />
                        <p className="text-gray-500">Failed to load preview.</p>
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading || isConfirming}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading || isConfirming || !previewData}
                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isConfirming ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Teams...
                            </>
                        ) : (
                            <>
                                <Coins className="w-4 h-4 mr-2" />
                                Confirm & Deduct UC
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
