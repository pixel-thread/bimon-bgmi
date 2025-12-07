"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Coins, Loader2, Trophy, History } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";

type Winner = {
    position: number;
    teamName: string;
    teamId: string;
    amount: number;
    isDistributed: boolean;
    recentWinnings?: number; // Total UC won in recent tournaments
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    tournamentName: string;
    winners: Winner[];
    isLoading?: boolean;
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const getMedalEmoji = (position: number) => {
    switch (position) {
        case 1: return "🥇";
        case 2: return "🥈";
        case 3: return "🥉";
        default: return "🏅";
    }
};

export function DistributeUCDialog({
    isOpen,
    onClose,
    tournamentId,
    tournamentName,
    winners,
    isLoading = false,
}: Props) {
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const queryClient = useQueryClient();

    const { isPending, mutate: distributeUC } = useMutation({
        mutationFn: (data: { placements: { position: number; amount: number }[] }) =>
            http.post(
                ADMIN_TOURNAMENT_ENDPOINTS.POST_DISTRIBUTE_WINNER_UC.replace(
                    ":id",
                    tournamentId
                ),
                data
            ),
        onSuccess: (data) => {
            if (data.success) {
                toast.success("UC distributed to winners successfully!");
                queryClient.invalidateQueries({ queryKey: ["tournament-winner"] });
                queryClient.invalidateQueries({ queryKey: ["tournament-winners"] });
                handleClose();
            } else {
                toast.error(data.message || "Failed to distribute UC");
            }
        },
        onError: () => toast.error("Failed to distribute UC"),
    });

    const handleClose = () => {
        setAmounts({});
        onClose();
    };

    const updateAmount = (position: number, value: string) => {
        setAmounts((prev) => ({ ...prev, [position]: value }));
    };

    const handleSubmit = () => {
        const placements = winners.map((winner) => ({
            position: winner.position,
            amount: amounts[winner.position] ? parseInt(amounts[winner.position]) : 0,
        }));

        distributeUC({ placements });
    };

    const totalUC = Object.values(amounts).reduce(
        (sum, amt) => sum + (parseInt(amt) || 0),
        0
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-green-500" />
                        Distribute UC
                    </DialogTitle>
                    <DialogDescription>
                        Distribute UC prizes for <span className="font-medium">{tournamentName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading winners...</span>
                        </div>
                    ) : (
                        <>
                            {/* Winners with UC Input */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Prize Amounts (UC)</Label>
                                {winners.map((winner) => (
                                    <Card key={winner.position} className={`${winner.position === 1 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : winner.position === 2 ? "border-gray-400 bg-gray-50 dark:bg-gray-800/50" : winner.position === 3 ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                                        <CardContent className="p-3">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xl">{getMedalEmoji(winner.position)}</span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {winner.teamName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {getOrdinal(winner.position)} Place
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Recent Winnings Info */}
                                            {winner.recentWinnings !== undefined && winner.recentWinnings > 0 && (
                                                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mb-2 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                                                    <History className="h-3 w-3" />
                                                    Recent winnings: {winner.recentWinnings} UC
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs w-16">Amount:</Label>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter UC"
                                                    value={amounts[winner.position] || ""}
                                                    onChange={(e) => updateAmount(winner.position, e.target.value)}
                                                    className="flex-1 h-8 text-sm"
                                                    min="0"
                                                />
                                                <span className="text-xs text-muted-foreground">UC</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Total Summary */}
                            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                                <span className="text-sm font-medium">Total UC to distribute:</span>
                                <Badge variant="secondary" className="text-base font-bold">
                                    {totalUC} UC
                                </Badge>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || winners.length === 0 || totalUC === 0}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Coins className="w-4 h-4 mr-2" />
                        )}
                        Distribute UC
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
