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
import { Plus, Trash2, Trophy, Loader2, Users } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";

type TeamRanking = {
    teamId: string;
    name: string;
    total: number;
    kills: number;
    pts: number;
    // Tiebreaker fields
    chickenDinners?: number;
    placementPoints?: number;
    totalKills?: number;
    lastMatchPosition?: number;
    players?: { id: string; name: string }[];
};

type Placement = {
    position: number;
    amount: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    tournamentName: string;
    teamRankings: TeamRanking[];
    isLoadingRankings?: boolean;
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

export function DeclareWinnerDialog({
    isOpen,
    onClose,
    tournamentId,
    tournamentName,
    teamRankings,
    isLoadingRankings = false,
}: Props) {
    const [placements, setPlacements] = useState<Placement[]>([
        { position: 1, amount: "" },
        { position: 2, amount: "" },
    ]);
    const queryClient = useQueryClient();

    const { isPending, mutate: declareWinners } = useMutation({
        mutationFn: (data: { placements: { position: number; amount: number }[] }) =>
            http.post(
                ADMIN_TOURNAMENT_ENDPOINTS.POST_DECLEAR_TOURNAMENT_WINNER.replace(
                    ":id",
                    tournamentId
                ),
                data
            ),
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Tournament winners declared successfully!");
                queryClient.invalidateQueries({
                    queryKey: ["tournament", tournamentId],
                });
                queryClient.invalidateQueries({ queryKey: ["tournament-winners"] });
                handleClose();
            } else {
                toast.error(data.message || "Failed to declare winners");
            }
        },
        onError: () => toast.error("Failed to declare winners"),
    });

    const handleClose = () => {
        setPlacements([
            { position: 1, amount: "" },
            { position: 2, amount: "" },
        ]);
        onClose();
    };

    const addPlacement = () => {
        const nextPosition = placements.length + 1;
        if (nextPosition <= teamRankings.length) {
            setPlacements([...placements, { position: nextPosition, amount: "" }]);
        }
    };

    const removePlacement = (position: number) => {
        if (placements.length > 2) {
            setPlacements(placements.filter((p) => p.position !== position));
            // Reorder remaining placements
            setPlacements((prev) =>
                prev
                    .filter((p) => p.position !== position)
                    .map((p, idx) => ({ ...p, position: idx + 1 }))
            );
        }
    };

    const updateAmount = (position: number, amount: string) => {
        setPlacements(
            placements.map((p) =>
                p.position === position ? { ...p, amount } : p
            )
        );
    };

    const handleSubmit = () => {
        // Allow 0 or empty amounts (treat as 0 UC prize)
        const data = {
            placements: placements.map((p) => ({
                position: p.position,
                amount: p.amount ? parseInt(p.amount) : 0,
            })),
        };

        declareWinners(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Declare Winners
                    </DialogTitle>
                    <DialogDescription>
                        Configure prize amounts for <span className="font-medium">{tournamentName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Team Rankings Preview */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Team Rankings</Label>
                        {isLoadingRankings ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading teams...</span>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {teamRankings.slice(0, placements.length).map((team, idx) => (
                                    <Card key={team.teamId} className={`${idx === 0 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : idx === 1 ? "border-gray-400 bg-gray-50 dark:bg-gray-800/50" : idx === 2 ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <span className="text-xl">{getMedalEmoji(idx + 1)}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                    {team.players?.map(p => p.name).join(", ") || "No players"}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="text-xs">
                                                {team.total} pts
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Prize Configuration */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Prize Amounts (UC)</Label>
                        <div className="space-y-3">
                            {placements.map((placement) => (
                                <div key={placement.position} className="flex items-center gap-3">
                                    <span className="text-lg w-8">{getMedalEmoji(placement.position)}</span>
                                    <Label className="w-20 text-sm">{getOrdinal(placement.position)} Place</Label>
                                    <Input
                                        type="number"
                                        placeholder="Enter UC amount"
                                        value={placement.amount}
                                        onChange={(e) => updateAmount(placement.position, e.target.value)}
                                        className="flex-1"
                                        min="0"
                                    />
                                    {placement.position > 2 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removePlacement(placement.position)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Placement Button */}
                    {placements.length < teamRankings.length && placements.length < 10 && (
                        <Button
                            variant="outline"
                            onClick={addPlacement}
                            className="w-full gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add {getOrdinal(placements.length + 1)} Placement
                        </Button>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Trophy className="w-4 h-4 mr-2" />
                        )}
                        Declare Winners
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
