"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Plus, Trash2, Trophy, Loader2, Coins, ChevronDown, Undo2 } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";
import { getFinalDistribution, getTeamSize, getTierInfo } from "@/src/utils/prizeDistribution";
import { useSeasonStore } from "@/src/store/season";

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
    teamType: string;
};

type Props = {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    tournamentName: string;
    teamRankings: TeamRanking[];
    prizePoolMeta?: PrizePoolMeta;
    isLoadingRankings?: boolean;
    isWinnerDeclared?: boolean;
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
    isWinnerDeclared = false,
}: Props) {
    const [placementCount, setPlacementCount] = useState(2);
    const queryClient = useQueryClient();
    const { seasonId } = useSeasonStore();

    // Undo winner declaration mutation
    const { isPending: isUndoing, mutate: undoWinner } = useMutation({
        mutationFn: () => http.post(`/admin/tournament/${tournamentId}/undo-winner`),
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Winner declaration undone! UC transactions have been reversed.");
                handleClose();
                queryClient.invalidateQueries({ queryKey: ["tournament", tournamentId] });
                queryClient.invalidateQueries({ queryKey: ["tournaments"] });
                queryClient.invalidateQueries({ queryKey: ["tournament-winners"] });
                queryClient.invalidateQueries({ queryKey: ["tournament-rankings"] });
                queryClient.invalidateQueries({ queryKey: ["solo-tax-pool"] });
            } else {
                toast.error(data.message || "Failed to undo winner declaration");
            }
        },
        onError: () => {
            toast.error("Failed to undo winner declaration");
        },
    });

    const handleUndoWinner = () => {
        if (confirm("Are you sure you want to undo the winner declaration? This will:\n\n• Reverse all UC transactions\n• Delete winner records\n• Delete income records\n\nThis action cannot be easily undone!")) {
            undoWinner();
        }
    };

    // Fetch bonus pool from solo tax (accumulated from previous solo winners)
    const { data: bonusPoolData } = useQuery({
        queryKey: ["solo-tax-pool", seasonId],
        queryFn: async (): Promise<{ amount: number; donorName: string | null }> => {
            if (!seasonId) return { amount: 0, donorName: null };
            const response = await http.get(`/solo-tax-pool?seasonId=${seasonId}`);
            return (response.data as { amount: number; donorName: string | null }) || { amount: 0, donorName: null };
        },
        enabled: isOpen && !!seasonId,
    });

    const bonusPool = bonusPoolData?.amount || 0;
    const bonusDonorName = bonusPoolData?.donorName || null;

    // Add bonus pool to total prize pool
    const basePrizePool = prizePoolMeta?.prizePool || 0;
    const prizePool = basePrizePool + bonusPool;
    const entryFee = prizePoolMeta?.entryFee || 0;
    const totalPlayers = prizePoolMeta?.totalPlayers || 0;
    const teamType = prizePoolMeta?.teamType || "DUO";
    const teamSize = getTeamSize(teamType);

    const ucExemptCount = prizePoolMeta?.ucExemptCount || 0;

    // Get tier info for smart default winner count
    const tier = getTierInfo(prizePool);

    // Sync placementCount with tier when dialog opens or prize pool changes
    useEffect(() => {
        if (isOpen && prizePool > 0) {
            setPlacementCount(tier.winnerCount);
        }
    }, [isOpen, prizePool, tier.winnerCount]);

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
        // Match participation data
        matchesPlayed: number;
        totalMatches: number;
        participationRate: number;
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
        () => getFinalDistribution(prizePool, entryFee, teamSize, ucExemptCount),
        [prizePool, entryFee, teamSize, ucExemptCount]
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

    /**
     * Calculate participation-adjusted amounts for a team (50% softened penalty).
     * Players who miss matches get reduced prizes, redistributed to committed players.
     */
    const getParticipationAdjustedAmounts = (
        players: { id: string; name: string; displayName?: string | null }[],
        basePerPlayer: number
    ): Map<string, { base: number; adjusted: number; bonus: number; penalty: number; matchesPlayed: number; totalMatches: number; rate: number }> => {
        const result = new Map<string, { base: number; adjusted: number; bonus: number; penalty: number; matchesPlayed: number; totalMatches: number; rate: number }>();

        if (players.length === 0 || basePerPlayer === 0) return result;

        // Get participation rates for all players
        const rates: { id: string; rate: number; matchesPlayed: number; totalMatches: number }[] = [];
        for (const p of players) {
            const tax = taxPreview[p.id];
            const matchesPlayed = tax?.matchesPlayed ?? 0;
            const totalMatches = tax?.totalMatches ?? 1;
            const rate = tax?.participationRate ?? 1;
            rates.push({ id: p.id, rate, matchesPlayed, totalMatches });
        }

        // If tournament has no matches yet (totalMatches = 0), everyone gets full share
        const firstPlayer = rates[0];
        if (!firstPlayer || firstPlayer.totalMatches === 0) {
            for (const p of players) {
                result.set(p.id, {
                    base: basePerPlayer,
                    adjusted: basePerPlayer,
                    bonus: 0,
                    penalty: 0,
                    matchesPlayed: 0,
                    totalMatches: 0,
                    rate: 1,
                });
            }
            return result;
        }

        // Calculate average participation rate
        const totalWeight = rates.reduce((sum, r) => sum + r.rate, 0);
        const averageRate = totalWeight / players.length;

        // Apply 50% softened adjustment
        const SOFTENING_FACTOR = 0.5;

        for (const r of rates) {
            const difference = r.rate - averageRate;
            const adjustment = Math.floor(difference * basePerPlayer * SOFTENING_FACTOR);

            result.set(r.id, {
                base: basePerPlayer,
                adjusted: basePerPlayer + adjustment,
                bonus: adjustment > 0 ? adjustment : 0,
                penalty: adjustment < 0 ? -adjustment : 0,
                matchesPlayed: r.matchesPlayed,
                totalMatches: r.totalMatches,
                rate: r.rate,
            });
        }

        return result;
    };

    // Calculate total tax from all winning players (using participation-adjusted amounts)
    const taxTotals = useMemo(() => {
        let totalRepeatTax = 0;
        let totalSoloTax = 0;
        teamRankings.slice(0, placementCount).forEach((team, idx) => {
            const playerCount = team.players?.length || 0;
            if (playerCount === 0) return;
            const perPlayer = getPerPlayerAmount(idx + 1, playerCount);

            // Get participation-adjusted amounts for this team
            const participationAmounts = getParticipationAdjustedAmounts(
                team.players || [],
                perPlayer
            );

            team.players?.forEach(p => {
                const tax = taxPreview[p.id];
                if (tax) {
                    // Use participation-adjusted amount as base for tax calculation
                    const pa = participationAmounts.get(p.id);
                    const adjustedAmount = pa?.adjusted ?? perPlayer;

                    if (tax.repeatWinnerTaxRate > 0) {
                        totalRepeatTax += Math.floor(adjustedAmount * tax.repeatWinnerTaxRate);
                    }
                    if (tax.soloTaxRate > 0) {
                        totalSoloTax += Math.floor(adjustedAmount * tax.soloTaxRate);
                    }
                }
            });
        });
        const totalTax = totalRepeatTax + totalSoloTax;

        return {
            total: totalTax,
            repeatTax: totalRepeatTax,
            soloTax: totalSoloTax,
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
                // Close dialog FIRST to prevent tax-preview refetch from showing stale +1 win counts
                handleClose();
                // Then invalidate queries (dialog already closed, so no visual flash)
                queryClient.invalidateQueries({
                    queryKey: ["tournament", tournamentId],
                });
                queryClient.invalidateQueries({ queryKey: ["tournament-winners"] });
                queryClient.invalidateQueries({ queryKey: ["tournament-rankings"] });
                queryClient.invalidateQueries({ queryKey: ["solo-tax-pool"] }); // Refresh bonus pool display
            } else {
                toast.error(data.message || "Failed to declare winners");
            }
        },
        onError: () => toast.error("Failed to declare winners"),
    });

    const handleClose = () => {
        // Reset to tier-based default winner count
        setPlacementCount(tier.winnerCount);
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
                        {isWinnerDeclared ? "Tournament Results" : "Declare Winners & Distribute UC"}
                    </DialogTitle>
                    <DialogDescription>
                        {isWinnerDeclared
                            ? <>Results for <span className="font-medium">{tournamentName}</span>.</>
                            : <>Declare winners and distribute UC for <span className="font-medium">{tournamentName}</span>.</>
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {/* Prize Pool Summary - Collapsible */}
                    {prizePool > 0 && (
                        <Collapsible>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-green-100/50 dark:hover:bg-green-800/20 rounded-lg transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Coins className="h-4 w-4 text-green-600" />
                                        <span className="font-semibold text-green-800 dark:text-green-200 text-sm">Prize Pool</span>
                                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs">
                                            ₹{prizePool.toLocaleString()}
                                        </Badge>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="px-3 pb-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                            <div className="text-muted-foreground">Entry Fee:</div>
                                            <div className="font-medium">₹{entryFee}</div>
                                            <div className="text-muted-foreground">Players:</div>
                                            <div className="font-medium">{totalPlayers}</div>
                                            {bonusPool > 0 && (
                                                <>
                                                    <div className="text-muted-foreground">Base Pool:</div>
                                                    <div className="font-medium">₹{basePrizePool.toLocaleString()}</div>
                                                    <div className="text-muted-foreground">🎁 Bonus:</div>
                                                    <div className="font-medium text-purple-600 dark:text-purple-400">
                                                        +₹{bonusPool.toLocaleString()}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="pt-2 border-t border-green-200 dark:border-green-700 space-y-0.5 text-xs">
                                            {Array.from(distribution.prizes.entries())
                                                .sort(([a], [b]) => a - b)
                                                .map(([position, prize]) => {
                                                    const medals = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
                                                    const medal = medals[position - 1] || '🏅';

                                                    // Calculate total tax for this position
                                                    const team = teamRankings[position - 1];
                                                    let teamTax = 0;
                                                    if (team && team.players) {
                                                        const playerCount = team.players.length;
                                                        const perPlayer = getPerPlayerAmount(position, playerCount);
                                                        const participationAmounts = getParticipationAdjustedAmounts(team.players, perPlayer);

                                                        team.players.forEach(p => {
                                                            const tax = taxPreview[p.id];
                                                            if (tax) {
                                                                const pa = participationAmounts.get(p.id);
                                                                const adjustedAmount = pa?.adjusted ?? perPlayer;
                                                                if (tax.repeatWinnerTaxRate > 0) {
                                                                    teamTax += Math.floor(adjustedAmount * tax.repeatWinnerTaxRate);
                                                                }
                                                                if (tax.soloTaxRate > 0) {
                                                                    teamTax += Math.floor(adjustedAmount * tax.soloTaxRate);
                                                                }
                                                            }
                                                        });
                                                    }

                                                    const netPrize = prize.amount - teamTax;
                                                    const label = prize.isFixed
                                                        ? `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} (refund)`
                                                        : `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} (${prize.percentage}%)`;

                                                    return (
                                                        <div key={position} className="flex justify-between">
                                                            <span>{medal} {label}:</span>
                                                            <span className="font-medium">
                                                                {teamTax > 0 ? (
                                                                    <>
                                                                        <span className="text-muted-foreground line-through mr-1">₹{prize.amount.toLocaleString()}</span>
                                                                        <span className="text-amber-600 dark:text-amber-400">-₹{teamTax}</span>
                                                                        <span className="mx-1">=</span>
                                                                        <span>₹{netPrize.toLocaleString()}</span>
                                                                    </>
                                                                ) : (
                                                                    <>₹{prize.amount.toLocaleString()}</>
                                                                )}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>💼 Org ({distribution.tier.orgFeePercent}%){ucExemptCount > 0 ? ` - ₹${distribution.ucExemptCost} UC Exempt` : ""}:</span>
                                                <span className="font-medium text-foreground">
                                                    {(ucExemptCount > 0 || taxTotals.orgContribution > 0) ? (
                                                        <>
                                                            <span className="text-muted-foreground">₹{(organizerAmount + distribution.ucExemptCost).toLocaleString()}</span>
                                                            {ucExemptCount > 0 && <span className="text-amber-600 dark:text-amber-400"> -₹{distribution.ucExemptCost}</span>}
                                                            {taxTotals.orgContribution > 0 && <span className="text-green-600 dark:text-green-400"> +₹{taxTotals.orgContribution}</span>}
                                                            <span className="mx-1">=</span>
                                                            <span>₹{(organizerAmount + taxTotals.orgContribution).toLocaleString()}</span>
                                                        </>
                                                    ) : (
                                                        <>₹{organizerAmount.toLocaleString()}</>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground">
                                                <span>🏦 Fund ({distribution.tier.fundPercent}%):</span>
                                                <span className="font-medium text-foreground">
                                                    {taxTotals.fundContribution > 0 ? (
                                                        <>
                                                            <span className="text-muted-foreground">₹{distribution.finalFundAmount.toLocaleString()}</span>
                                                            <span className="text-green-600 dark:text-green-400"> +₹{taxTotals.fundContribution}</span>
                                                            <span className="mx-1">=</span>
                                                            <span>₹{(distribution.finalFundAmount + taxTotals.fundContribution).toLocaleString()}</span>
                                                        </>
                                                    ) : (
                                                        <>₹{distribution.finalFundAmount.toLocaleString()}</>
                                                    )}
                                                </span>
                                            </div>


                                            {/* Informational Notes */}
                                            <div className="mt-3 pt-2 border-t border-dashed border-green-200 dark:border-green-800 space-y-1 opacity-80 italic">
                                                {taxTotals.repeatTax > 0 && (
                                                    <div className="flex justify-between text-[10px] text-amber-600 dark:text-amber-500">
                                                        <span>Note: ₹{taxTotals.repeatTax} Repeat Winner Tax was deducted from prizes and added to Organizer (₹{taxTotals.orgContribution}) & Fund (₹{taxTotals.fundContribution}).</span>
                                                    </div>
                                                )}
                                                {taxTotals.soloTax > 0 && (
                                                    <div className="flex justify-between text-[10px] text-purple-600 dark:text-purple-500">
                                                        <span>Note: ₹{taxTotals.soloTax} Solo Tax was deducted from prizes and added to Loser Support (₹{taxTotals.soloToLosers}) & Next Pool (₹{taxTotals.soloToPool}).</span>
                                                    </div>
                                                )}
                                                {ucExemptCount > 0 && (
                                                    <div className="flex justify-between text-[10px] text-amber-600 dark:text-amber-500">
                                                        <span>Note: {ucExemptCount} UC-Exempt = ₹{distribution.ucExemptCost}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleContent>
                            </div>
                        </Collapsible>
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

                                    // Get participation-adjusted amounts for all players
                                    const participationAmounts = getParticipationAdjustedAmounts(
                                        team.players || [],
                                        perPlayer
                                    );

                                    // Check if any adjustments (bonus/penalty) 
                                    const hasAnyAdjustment = Array.from(participationAmounts.values()).some(
                                        pa => pa.bonus > 0 || pa.penalty > 0
                                    );

                                    // Check if any player on this team has tax
                                    const playersWithTax = team.players?.filter(p => {
                                        const tax = taxPreview[p.id];
                                        return tax && tax.taxRate > 0;
                                    }) || [];
                                    const hasTax = playersWithTax.length > 0;

                                    // Check if we should show player details (has adjustment or tax)
                                    const showPlayerDetails = hasAnyAdjustment || hasTax;

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
                                                                ₹{perPlayer}/player (base)
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Player details: participation + tax adjustments */}
                                                {showPlayerDetails && teamPrize > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-dashed space-y-1.5">
                                                        {team.players?.map(p => {
                                                            const tax = taxPreview[p.id];
                                                            const pa = participationAmounts.get(p.id);
                                                            if (!pa) return null;

                                                            // Calculate final amount: adjusted for participation, then taxed
                                                            const afterParticipation = pa.adjusted;
                                                            const finalAmount = getTaxedAmount(p.id, afterParticipation);
                                                            const taxDeduction = afterParticipation - finalAmount;

                                                            return (
                                                                <div key={p.id} className="text-xs space-y-0.5">
                                                                    {/* Player name + badges row */}
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="font-medium text-foreground">
                                                                            {p.displayName || p.name}
                                                                        </span>
                                                                        {/* Participation badge */}
                                                                        {pa.totalMatches > 0 && (
                                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pa.rate >= 1
                                                                                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                                                : pa.rate >= 0.5
                                                                                    ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                                                                                    : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                                                                }`}>
                                                                                {pa.matchesPlayed}/{pa.totalMatches} matches
                                                                            </span>
                                                                        )}
                                                                        {tax?.isSolo && (
                                                                            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                                                SOLO
                                                                            </span>
                                                                        )}
                                                                        {tax?.repeatWinnerTaxRate && tax.repeatWinnerTaxRate > 0 && (
                                                                            <span className="text-amber-600 dark:text-amber-400 text-[10px]">
                                                                                🔄 {tax.totalWins} wins
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Amount calculation row */}
                                                                    <div className="flex items-center justify-between text-muted-foreground">
                                                                        <div className="flex items-center gap-1">
                                                                            <span>₹{perPlayer}</span>
                                                                            {/* Participation adjustment */}
                                                                            {pa.bonus > 0 && (
                                                                                <span className="text-green-600 dark:text-green-400">
                                                                                    +{pa.bonus}
                                                                                </span>
                                                                            )}
                                                                            {pa.penalty > 0 && (
                                                                                <span className="text-orange-600 dark:text-orange-400">
                                                                                    -{pa.penalty}
                                                                                </span>
                                                                            )}
                                                                            {/* Tax deduction */}
                                                                            {taxDeduction > 0 && (
                                                                                <span className="text-amber-600 dark:text-amber-400">
                                                                                    -{taxDeduction} tax
                                                                                </span>
                                                                            )}
                                                                            <span className="mx-1">→</span>
                                                                        </div>
                                                                        <span className={`font-semibold ${pa.bonus > 0 ? 'text-green-600 dark:text-green-400' :
                                                                            pa.penalty > 0 ? 'text-orange-600 dark:text-orange-400' :
                                                                                'text-foreground'
                                                                            }`}>
                                                                            ₹{finalAmount}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Placement Controls - only when declaring */}
                    {!isWinnerDeclared && (
                        <div className="flex flex-wrap items-center gap-2">
                            {placementCount < teamRankings.length && placementCount < 10 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addPlacement}
                                    className="gap-1 text-xs h-8"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add {getOrdinal(placementCount + 1)} Place
                                </Button>
                            )}
                            {placementCount > 2 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={removePlacement}
                                    className="gap-1 text-xs h-8 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove {getOrdinal(placementCount)} Place
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {isWinnerDeclared ? (
                        <Button
                            onClick={handleUndoWinner}
                            disabled={isUndoing}
                            variant="destructive"
                            className="w-full gap-1.5"
                        >
                            {isUndoing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Undo2 className="h-4 w-4" />
                            )}
                            {isUndoing ? "Undoing Declaration..." : "Undo Declaration"}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isPending || teamRankings.length === 0}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trophy className="w-4 h-4 mr-2" />
                            )}
                            {prizePool > 0 ? "Declare & Distribute" : "Declare Winners"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
