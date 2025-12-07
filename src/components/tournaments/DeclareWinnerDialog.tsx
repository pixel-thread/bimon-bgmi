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
import { Label } from "@/src/components/ui/label";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Plus, Trash2, Trophy, Loader2 } from "lucide-react";
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
    chickenDinners?: number;
    placementPoints?: number;
    totalKills?: number;
    lastMatchPosition?: number;
    players?: { id: string; name: string }[];
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
    const [placementCount, setPlacementCount] = useState(2);
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
                toast.success("Tournament winners declared successfully! You can distribute UC from the Winners page.");
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
        setPlacementCount(2);
        onClose();
    };

    const addPlacement = () => {
        if (placementCount < teamRankings.length && placementCount < 10) {
            setPlacementCount(placementCount + 1);
        }
    };

    const removePlacement = () => {
        if (placementCount > 2) {
            setPlacementCount(placementCount - 1);
        }
    };

    const handleSubmit = () => {
        // Declare winners with 0 UC (will be distributed later from Winners page)
        const data = {
            placements: Array.from({ length: placementCount }, (_, i) => ({
                position: i + 1,
                amount: 0,
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
                        Declare winners for <span className="font-medium">{tournamentName}</span>.
                        You can distribute UC later from the Winners page.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Team Rankings Preview */}
                    <div>
                        <Label className="text-sm font-medium mb-2 block">
                            Team Rankings (Top {placementCount})
                        </Label>
                        {isLoadingRankings ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading teams...</span>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {teamRankings.slice(0, placementCount).map((team, idx) => (
                                    <Card key={team.teamId} className={`${idx === 0 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : idx === 1 ? "border-gray-400 bg-gray-50 dark:bg-gray-800/50" : idx === 2 ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <span className="text-xl">{getMedalEmoji(idx + 1)}</span>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">
                                                    {team.players?.map(p => p.name).join(", ") || "No players"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {getOrdinal(idx + 1)} Place
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

                    {/* Placement Controls */}
                    <div className="flex items-center gap-2">
                        {placementCount < teamRankings.length && placementCount < 10 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addPlacement}
                                className="gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                Add {getOrdinal(placementCount + 1)} Place
                            </Button>
                        )}
                        {placementCount > 2 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={removePlacement}
                                className="gap-1 text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                                Remove {getOrdinal(placementCount)} Place
                            </Button>
                        )}
                    </div>

                    {/* Info Note */}
                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        💡 After declaring winners, you can distribute UC prizes from the <strong>Winners page</strong> (/admin/winners).
                    </p>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || teamRankings.length === 0}
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
