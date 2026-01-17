"use client";

import { useState, useMemo } from "react";
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
import { Plus, Trash2, Trophy, Loader2, Coins, Crown } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { getFinalDistribution, getTeamSize } from "@/src/utils/prizeDistribution";

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
    players?: { id: string; name: string; displayName?: string | null }[];
};

type PrizePoolMeta = {
    entryFee: number;
    totalPlayers: number;
    prizePool: number;
    ucExemptCount: number;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    tournamentName: string;
    teamRankings: TeamRanking[];
    prizePoolMeta?: PrizePoolMeta;
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
    prizePoolMeta,
    isLoadingRankings = false,
}: Props) {
    const [placementCount, setPlacementCount] = useState(2);
    const queryClient = useQueryClient();

    const prizePool = prizePoolMeta?.prizePool || 0;
    const entryFee = prizePoolMeta?.entryFee || 0;
    const totalPlayers = prizePoolMeta?.totalPlayers || 0;

    const ucExemptCount = prizePoolMeta?.ucExemptCount || 0;

    // Get player IDs from top teams for tax preview
    const topTeamPlayerIds = useMemo(() => {
        const ids: string[] = [];
        teamRankings.slice(0, placementCount).forEach(team => {
            team.players?.forEach(p => ids.push(p.id));
        });
        return ids;
    }, [teamRankings, placementCount]);

    // Fetch tax preview for winning players
    type TaxPreviewData = Record<string, {
        previousWins: number;
        totalWins: number;
        taxRate: number;
        taxPercentage: string;
        repeatWinnerTaxRate: number;
        soloTaxRate: number;
        isSolo: boolean;
        hasRoyalPass: boolean;
    }>;

    const { data: taxPreviewData } = useQuery({
        queryKey: ["tax-preview", tournamentId, topTeamPlayerIds.join(",")],
        queryFn: () => http.get<TaxPreviewData>(
            `/admin/tournament/${tournamentId}/tax-preview?playerIds=${topTeamPlayerIds.join(",")}`
        ),
        enabled: isOpen && topTeamPlayerIds.length > 0,
    });

    const taxPreview = taxPreviewData?.data || {};

    // Get dynamic prize distribution based on prize pool tier with UC-exempt adjustments
    const distribution = useMemo(
        () => getFinalDistribution(prizePool, entryFee, getTeamSize("DUO"), ucExemptCount),
        [prizePool, entryFee, ucExemptCount]
    );

    // Calculate prize amounts per position from dynamic distribution
    const getPrizeForPositionAmount = (position: number) => {
        return distribution.prizes.get(position)?.amount ?? 0;
    };

    // Calculate per-player split for a team (with optional tax)
    const getPerPlayerAmount = (position: number, playerCount: number) => {
        if (playerCount === 0) return 0;
        const totalAmount = getPrizeForPositionAmount(position);
        return Math.floor(totalAmount / playerCount);
    };

    // Get tax-adjusted amount for a player
    const getTaxedAmount = (playerId: string, baseAmount: number) => {
        const tax = taxPreview[playerId];
        if (!tax || tax.taxRate === 0) return baseAmount;
        return Math.floor(baseAmount * (1 - tax.taxRate));
    };

    // Calculate total tax from all winning players
    const taxTotals = useMemo(() => {
        let totalRepeatTax = 0;
        let totalSoloTax = 0;
        teamRankings.slice(0, placementCount).forEach((team, idx) => {
            const playerCount = team.players?.length || 0;
            if (playerCount === 0) return;
            const perPlayer = getPerPlayerAmount(idx + 1, playerCount);
            team.players?.forEach(p => {
                const tax = taxPreview[p.id];
                if (tax) {
                    if (tax.repeatWinnerTaxRate > 0) {
                        totalRepeatTax += Math.floor(perPlayer * tax.repeatWinnerTaxRate);
                    }
                    if (tax.soloTaxRate > 0) {
                        totalSoloTax += Math.floor(perPlayer * tax.soloTaxRate);
                    }
                }
            });
        });
        const totalTax = totalRepeatTax + totalSoloTax;

        // Calculate total RP Safety Net refund that org will pay out (only first non-prize position)
        let totalRpBonus = 0;
        const safetyNetPosition = placementCount; // Index of first non-prize team (0-indexed)
        const safetyNetTeam = teamRankings[safetyNetPosition];
        if (safetyNetTeam) {
            safetyNetTeam.players?.forEach(p => {
                const tax = taxPreview[p.id];
                if (tax?.hasRoyalPass) {
                    // RP Safety Net: Refund entry fee to 3rd place RP holders
                    totalRpBonus += entryFee;
                }
            });
        }

        return {
            total: totalTax,
            repeatTax: totalRepeatTax,
            soloTax: totalSoloTax,
            rpBonus: totalRpBonus,
            // Only REPEAT winner tax goes to Org/Fund (not solo tax)
            fundContribution: Math.floor(totalRepeatTax * 0.60),
            orgContribution: Math.ceil(totalRepeatTax * 0.40),
            // Solo tax goes to losers (60%) and next tournament pool (40%)
            soloToLosers: Math.floor(totalSoloTax * 0.60),
            soloToPool: Math.ceil(totalSoloTax * 0.40),
        };
    }, [taxPreview, teamRankings, placementCount]);

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
                toast.success("Winners declared and UC distributed successfully!");
                queryClient.invalidateQueries({
                    queryKey: ["tournament", tournamentId],
                });
                queryClient.invalidateQueries({ queryKey: ["tournament-winners"] });
                queryClient.invalidateQueries({ queryKey: ["tournament-rankings"] });
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
        // Include calculated UC amounts in placements
        const data = {
            placements: Array.from({ length: placementCount }, (_, i) => ({
                position: i + 1,
                amount: getPrizeForPositionAmount(i + 1),
            })),
        };
        declareWinners(data);
    };

    const organizerAmount = distribution.finalOrgAmount;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Declare Winners & Distribute UC
                    </DialogTitle>
                    <DialogDescription>
                        Declare winners and distribute UC for <span className="font-medium">{tournamentName}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Prize Pool Summary */}
                    {prizePool > 0 && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-3">
                                <Coins className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-800 dark:text-green-200">Prize Pool</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="text-muted-foreground">Entry Fee:</div>
                                <div className="font-medium">₹{entryFee}</div>
                                <div className="text-muted-foreground">Total Players:</div>
                                <div className="font-medium">{totalPlayers}</div>
                                <div className="text-muted-foreground font-semibold">Total Prize Pool:</div>
                                <div className="font-bold text-green-600 dark:text-green-400">₹{prizePool.toLocaleString()}</div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700 space-y-1 text-xs">
                                {Array.from(distribution.prizes.entries())
                                    .sort(([a], [b]) => a - b)
                                    .map(([position, prize]) => {
                                        const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
                                        const medal = medals[position - 1] || '🏅';
                                        const label = prize.isFixed
                                            ? `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} (refund)`
                                            : `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} (${prize.percentage}%)`;
                                        return (
                                            <div key={position} className="flex justify-between">
                                                <span>{medal} {label}:</span>
                                                <span className="font-medium">₹{prize.amount.toLocaleString()}</span>
                                            </div>
                                        );
                                    })}
                                <div className="flex justify-between text-muted-foreground">
                                    <span>💼 Organizer ({distribution.tier.orgFeePercent}%){ucExemptCount > 0 ? ` - ${ucExemptCount} exempt` : ""}:</span>
                                    <span className="font-medium">
                                        {taxTotals.orgContribution > 0 ? (
                                            <>
                                                ₹{organizerAmount.toLocaleString()}
                                                <span className="text-amber-600 dark:text-amber-400"> +₹{taxTotals.orgContribution}</span>
                                                <span className="text-green-600 dark:text-green-400"> = ₹{(organizerAmount + taxTotals.orgContribution).toLocaleString()}</span>
                                            </>
                                        ) : (
                                            <>₹{organizerAmount.toLocaleString()}</>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>🏦 Fund ({distribution.tier.fundPercent}%):</span>
                                    <span className="font-medium">
                                        {taxTotals.fundContribution > 0 ? (
                                            <>
                                                ₹{distribution.finalFundAmount.toLocaleString()}
                                                <span className="text-amber-600 dark:text-amber-400"> +₹{taxTotals.fundContribution}</span>
                                                <span className="text-green-600 dark:text-green-400"> = ₹{(distribution.finalFundAmount + taxTotals.fundContribution).toLocaleString()}</span>
                                            </>
                                        ) : (
                                            <>₹{distribution.finalFundAmount.toLocaleString()}</>
                                        )}
                                    </span>
                                </div>
                                {taxTotals.repeatTax > 0 && (
                                    <div className="flex justify-between text-amber-600 dark:text-amber-400 pt-1 border-t border-green-200 dark:border-green-700">
                                        <span>🔄 Repeat Winner Tax:</span>
                                        <span className="font-medium">₹{taxTotals.repeatTax.toLocaleString()}</span>
                                    </div>
                                )}
                                {taxTotals.soloTax > 0 && (
                                    <div className="flex justify-between text-purple-600 dark:text-purple-400">
                                        <span>👤 Solo Tax (→ losers + next pool):</span>
                                        <span className="font-medium">₹{taxTotals.soloTax.toLocaleString()}</span>
                                    </div>
                                )}
                                {taxTotals.rpBonus > 0 && (
                                    <div className="flex justify-between text-amber-500 dark:text-amber-400">
                                        <span>👑 RP Safety Net (3rd place):</span>
                                        <span className="font-medium">-₹{taxTotals.rpBonus.toLocaleString()}</span>
                                    </div>
                                )}
                                {ucExemptCount > 0 && (
                                    <div className="flex justify-between text-amber-600 dark:text-amber-400 pt-1 border-t border-green-200 dark:border-green-700">
                                        <span>⚠️ UC-Exempt cost ({ucExemptCount} × ₹{entryFee}):</span>
                                        <span className="font-medium">-₹{distribution.ucExemptCost.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                                {teamRankings.slice(0, placementCount).map((team, idx) => {
                                    const playerCount = team.players?.length || 0;
                                    const teamPrize = getPrizeForPositionAmount(idx + 1);
                                    const perPlayer = getPerPlayerAmount(idx + 1, playerCount);

                                    // Check if any player on this team has tax
                                    const playersWithTax = team.players?.filter(p => {
                                        const tax = taxPreview[p.id];
                                        return tax && tax.taxRate > 0;
                                    }) || [];
                                    const hasTax = playersWithTax.length > 0;

                                    return (
                                        <Card key={team.teamId} className={`${idx === 0 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" : idx === 1 ? "border-gray-400 bg-gray-50 dark:bg-gray-800/50" : idx === 2 ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                                            <CardContent className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl">{getMedalEmoji(idx + 1)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">
                                                            {team.players?.map(p => p.displayName || p.name).join(", ") || "No players"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {getOrdinal(idx + 1)} Place • {team.total} pts
                                                        </p>
                                                    </div>
                                                    {teamPrize > 0 && (
                                                        <div className="text-right shrink-0">
                                                            <Badge variant="default" className="bg-green-600 text-xs">
                                                                ₹{teamPrize.toLocaleString()}
                                                            </Badge>
                                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                                ₹{perPlayer}/player
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Tax info for players (repeat winner + solo) */}
                                                {hasTax && (
                                                    <div className="mt-2 pt-2 border-t border-dashed space-y-1">
                                                        {team.players?.map(p => {
                                                            const tax = taxPreview[p.id];
                                                            if (!tax || tax.taxRate === 0) return null;
                                                            const taxedAmount = getTaxedAmount(p.id, perPlayer);
                                                            return (
                                                                <div key={p.id} className="flex items-center justify-between text-xs">
                                                                    <span className="flex items-center gap-1">
                                                                        {tax.isSolo && (
                                                                            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                                                SOLO
                                                                            </span>
                                                                        )}
                                                                        {tax.repeatWinnerTaxRate > 0 && (
                                                                            <span className="text-amber-600 dark:text-amber-400">
                                                                                🔄 {tax.totalWins} wins
                                                                            </span>
                                                                        )}
                                                                        <span className="text-muted-foreground">
                                                                            {p.displayName || p.name}
                                                                        </span>
                                                                    </span>
                                                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                                        ₹{perPlayer} → ₹{taxedAmount} <span className="text-[10px]">(-{tax.taxPercentage})</span>
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {/* RP Safety Net only applies to 3rd place, not shown in prize cards */}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
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
                    {prizePool > 0 ? (
                        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            💰 UC will be distributed immediately: {distribution.summaryText}, split equally among team members.
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            ℹ️ No entry fee set. Winners will be declared without UC distribution.
                        </p>
                    )}
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
                        {prizePool > 0 ? "Declare & Distribute" : "Declare Winners"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
