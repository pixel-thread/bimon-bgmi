"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Loader2, AlertTriangle, Users, Coins, Trophy, RefreshCw } from "lucide-react";
import type { PreviewTeamsByPollsResult, TeamPreview } from "@/src/services/team/previewTeamsByPoll";

interface PollTeamsPreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    previewData: PreviewTeamsByPollsResult | null;
    isLoading: boolean;
    isConfirming: boolean;
    onConfirm: () => void;
    onRegenerate?: () => void;
    teamSize: number;
}

function getKDColor(kd: number): string {
    if (kd >= 1.7) return "text-purple-500"; // legend
    if (kd >= 1.5) return "text-blue-500";   // ultra pro
    if (kd >= 1.0) return "text-green-500";  // pro
    if (kd >= 0.5) return "text-yellow-500"; // noob
    return "text-red-500";                   // ultra noob / bot
}

function getBalanceColor(balance: number, entryFee: number): string {
    if (entryFee === 0) return "text-gray-500";
    if (balance >= entryFee) return "text-green-500";
    return "text-red-500";
}

function TeamCard({ team, entryFee }: { team: TeamPreview; entryFee: number }) {
    return (
        <div className="p-2 sm:p-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Team header - compact */}
            <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-gray-800 dark:text-gray-100 text-xs">
                    Team {team.teamNumber}
                </span>
                <div className="flex items-center gap-1">
                    {/* @ts-expect-error recentWins may exist */}
                    {team.players.some(p => p.recentWins > 0) && (
                        <Trophy className="w-3 h-3 text-yellow-500" />
                    )}
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                        {team.players.length}p
                    </Badge>
                </div>
            </div>

            {/* Players list - compact for mobile */}
            <ul className="space-y-0.5">
                {team.players.map((player) => (
                    <li
                        key={player.id}
                        className="flex items-center justify-between py-1.5 sm:py-1 px-2 sm:px-1.5 bg-white dark:bg-gray-900 rounded text-xs"
                    >
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-[50%] sm:max-w-[45%]">
                            {player.userName}
                        </span>
                        <div className="flex items-center gap-2 sm:gap-1.5 shrink-0">
                            <span className={`font-mono text-xs ${getKDColor(player.kd)}`}>
                                {player.kd.toFixed(2)}
                            </span>
                            <span className={`font-mono text-xs ${getBalanceColor(player.balance, entryFee)}`}>
                                {player.balance}
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
    onRegenerate,
    teamSize,
}: PollTeamsPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full h-[100dvh] inset-0 translate-x-0 translate-y-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-[95vw] sm:h-[85vh] sm:max-w-4xl sm:max-h-[700px] max-w-none p-0 sm:rounded-xl rounded-none flex flex-col overflow-hidden">
                {/* Fixed Header */}
                <DialogHeader className="flex-shrink-0 p-3 sm:p-4 pb-2 border-b">
                    <DialogTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Preview Teams
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                        Review teams. UC debited on confirm.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-gray-500 text-sm">Generating teams...</p>
                        </div>
                    ) : previewData ? (
                        <div className="flex flex-col gap-3">
                            {/* Summary Bar - stacks on mobile */}
                            <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <Badge variant="secondary" className="text-xs truncate max-w-[150px] sm:max-w-[120px]">
                                    {previewData.tournamentName}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {previewData.teams.length} Teams
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    {previewData.totalPlayersEligible} Players
                                </Badge>
                                {previewData.entryFee > 0 && (
                                    <Badge variant="outline" className="text-xs text-amber-600">
                                        {previewData.entryFee} UC
                                    </Badge>
                                )}
                            </div>

                            {/* Low UC Warning */}
                            {previewData.playersWithInsufficientBalance.length > 0 && (
                                <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                        <span className="font-medium">Low UC: </span>
                                        {previewData.playersWithInsufficientBalance
                                            .slice(0, 5)
                                            .map((p) => p.userName)
                                            .join(", ")}
                                        {previewData.playersWithInsufficientBalance.length > 5 &&
                                            ` +${previewData.playersWithInsufficientBalance.length - 5} more`}
                                    </p>
                                </div>
                            )}

                            {/* Teams Grid - single column on very small screens */}
                            {previewData.teams.length > 0 ? (
                                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
                                    {previewData.teams.map((team) => (
                                        <TeamCard
                                            key={team.teamNumber}
                                            team={team}
                                            entryFee={previewData.entryFee}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8 text-sm">
                                    No teams generated.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <AlertTriangle className="w-8 h-8 text-yellow-500" />
                            <p className="text-gray-500 text-sm">Failed to load preview.</p>
                        </div>
                    )}
                </div>

                {/* Fixed Footer - better mobile touch targets */}
                <DialogFooter className="flex-shrink-0 flex flex-row gap-2 p-3 sm:p-4 pt-2 border-t bg-background">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading || isConfirming}
                        className="flex-1 h-10 sm:h-9 text-sm sm:text-sm"
                    >
                        Cancel
                    </Button>
                    {onRegenerate && (
                        <Button
                            variant="outline"
                            onClick={onRegenerate}
                            disabled={isLoading || isConfirming}
                            className="flex-1 h-10 sm:h-9 text-sm border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Shuffle
                        </Button>
                    )}
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading || isConfirming || !previewData}
                        className="flex-1 h-10 sm:h-9 text-sm bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white border-0"
                    >
                        {isConfirming ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Coins className="w-3.5 h-3.5 mr-1.5" />
                                Confirm ({previewData?.teams.length || 0})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

