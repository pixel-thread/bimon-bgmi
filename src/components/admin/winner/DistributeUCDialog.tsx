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
import { Coins, Loader2, History, User } from "lucide-react";
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
    players?: { id: string; name: string }[];
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
    // Map of playerId -> amount string
    const [playerAmounts, setPlayerAmounts] = useState<Record<string, string>>({});
    const queryClient = useQueryClient();

    const { isPending, mutate: distributeUC } = useMutation({
        mutationFn: (data: { playerAmounts: { playerId: string; amount: number }[] }) =>
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
        setPlayerAmounts({});
        onClose();
    };

    const updatePlayerAmount = (playerId: string, value: string) => {
        setPlayerAmounts((prev) => ({ ...prev, [playerId]: value }));
    };

    const handleSubmit = () => {
        const amounts = Object.entries(playerAmounts).map(([playerId, amount]) => ({
            playerId,
            amount: amount ? parseInt(amount) : 0,
        })).filter(entry => entry.amount > 0);

        if (amounts.length === 0) {
            toast.error("Please enter at least one prize amount");
            return;
        }

        distributeUC({ playerAmounts: amounts });
    };

    const totalUC = Object.values(playerAmounts).reduce(
        (sum, amt) => sum + (parseInt(amt) || 0),
        0
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-green-500" />
                        Distribute UC
                    </DialogTitle>
                    <DialogDescription>
                        Distribute UC prizes for individual players in <span className="font-medium">{tournamentName}</span>
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
                            <div className="space-y-4">
                                {winners.map((winner) => (
                                    <Card key={winner.position} className={`${winner.position === 1 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10" : winner.position === 2 ? "border-gray-400 bg-gray-50 dark:bg-gray-800/30" : winner.position === 3 ? "border-orange-400 bg-orange-50 dark:bg-orange-900/10" : ""}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-2xl">{getMedalEmoji(winner.position)}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-lg leading-none">
                                                            {winner.teamName}
                                                        </p>
                                                        <Badge variant="outline" className="text-xs">
                                                            {getOrdinal(winner.position)} Place
                                                        </Badge>
                                                    </div>

                                                    {/* Recent Winnings Info */}
                                                    {winner.recentWinnings !== undefined && winner.recentWinnings > 0 && (
                                                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                            <History className="h-3 w-3" />
                                                            Recent team winnings: {winner.recentWinnings} UC
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Players List */}
                                            <div className="space-y-2 pl-2">
                                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team Players</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {winner.players && winner.players.length > 0 ? (
                                                        winner.players.map(player => (
                                                            <div key={player.id} className="flex items-center gap-2 bg-background p-2 rounded-md border shadow-sm">
                                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium truncate">{player.name}</p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        value={playerAmounts[player.id] || ""}
                                                                        onChange={(e) => updatePlayerAmount(player.id, e.target.value)}
                                                                        className="w-20 h-8 text-sm text-right pr-1"
                                                                        min="0"
                                                                    />
                                                                    <span className="text-xs text-muted-foreground w-4">UC</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground col-span-2">No players found in this team.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Total Summary */}
                            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg sticky bottom-0 border-t backdrop-blur-sm">
                                <span className="text-sm font-medium">Total UC to distribute:</span>
                                <Badge variant="default" className="text-lg font-bold bg-green-600 hover:bg-green-700">
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
