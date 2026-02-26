"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Chip,
    Spinner,
    Tabs,
    Tab,
} from "@heroui/react";
import { Trophy, Plus, Trash2, Coins, ChevronDown, Undo2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getPrizeDistribution,
    getTierInfo,
    getTeamSize,
    getFinalDistribution,
} from "@/lib/logic/prizeDistribution";

// ─── Types ───────────────────────────────────────────────────
type TeamRanking = {
    teamId: string;
    name: string;
    total: number;
    kills: number;
    pts: number;
    players: { id: string; name: string }[];
};

type RankingsMeta = {
    entryFee: number;
    totalPlayers: number;
    prizePool: number;
    teamType: string;
    isWinnerDeclared: boolean;
    ucExemptCount: number;
};

type TaxPreviewData = Record<string, {
    previousWins: number;
    totalWins: number;
    taxRate: number;
    taxPercentage: string;
    repeatWinnerTaxRate: number;
    soloTaxRate: number;
    isSolo: boolean;
    matchesPlayed: number;
    totalMatches: number;
    participationRate: number;
}>;

type Props = {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    tournamentName: string;
    isWinnerDeclared: boolean;
    seasonId?: string;
};

const getMedal = (i: number) => ["🥇", "🥈", "🥉", "🏅", "🎖️"][i] ?? "🎖️";
const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const SOFTENING_FACTOR = 0.5;

export function DeclareWinnersModal({
    isOpen,
    onClose,
    tournamentId,
    tournamentName,
    isWinnerDeclared,
    seasonId,
}: Props) {
    const queryClient = useQueryClient();
    const [placementCount, setPlacementCount] = useState(2);
    const [poolOpen, setPoolOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("simple");

    // Fetch rankings (always)
    const { data: rankingsData, isLoading } = useQuery<{
        data: TeamRanking[];
        meta: RankingsMeta;
    }>({
        queryKey: ["tournament-rankings", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/tournaments/${tournamentId}/rankings`);
            if (!res.ok) throw new Error("Failed");
            return res.json();
        },
        enabled: isOpen && !!tournamentId,
    });

    const rankings = rankingsData?.data ?? [];
    const meta = rankingsData?.meta;
    const entryFee = meta?.entryFee ?? 0;
    const totalPlayers = meta?.totalPlayers ?? 0;
    const teamSize = getTeamSize(meta?.teamType ?? "DUO");
    const ucExemptCount = meta?.ucExemptCount ?? 0;

    // Fetch solo tax pool (only in detailed)
    const { data: bonusPoolData } = useQuery<{ amount: number; donorName: string | null }>({
        queryKey: ["solo-tax-pool", seasonId],
        queryFn: async () => {
            if (!seasonId) return { amount: 0, donorName: null };
            const res = await fetch(`/api/solo-tax-pool?seasonId=${seasonId}`);
            if (!res.ok) return { amount: 0, donorName: null };
            const json = await res.json();
            return json.data || { amount: 0, donorName: null };
        },
        enabled: isOpen && !!seasonId && activeTab === "detailed",
    });

    const bonusPool = activeTab === "detailed" ? (bonusPoolData?.amount || 0) : 0;
    const basePrizePool = meta?.prizePool ?? 0;
    const prizePool = basePrizePool + bonusPool;

    // Auto-set placement count from tier
    useEffect(() => {
        if (isOpen && basePrizePool > 0) {
            const tier = getTierInfo(basePrizePool);
            setPlacementCount(Math.min(tier.winnerCount, rankings.length || tier.winnerCount));
        }
    }, [isOpen, basePrizePool, rankings.length]);

    // Get player IDs for tax preview
    const topTeamPlayerIds = useMemo(() => {
        const ids: string[] = [];
        rankings.slice(0, placementCount).forEach(team => {
            team.players?.forEach(p => ids.push(p.id));
        });
        return ids;
    }, [rankings, placementCount]);

    // Prize distribution (must be before placementsParam which uses baseDist)
    // distribution uses basePrizePool for Org/Fund (matching declare-winners which excludes bonus pool)
    const distribution = useMemo(
        () => basePrizePool > 0 ? getFinalDistribution(basePrizePool, entryFee, teamSize, ucExemptCount) : null,
        [basePrizePool, entryFee, teamSize, ucExemptCount]
    );

    const baseDist = useMemo(
        () => prizePool > 0 ? getPrizeDistribution(prizePool, entryFee, teamSize) : null,
        [prizePool, entryFee, teamSize]
    );

    // Build placements param: "pos:amount:p1|p2,pos:amount:p1|p2"
    const placementsParam = useMemo(() => {
        if (!baseDist) return "";
        return rankings.slice(0, placementCount).map((team, idx) => {
            const pos = idx + 1;
            const amount = baseDist.prizes.get(pos)?.amount ?? 0;
            const pids = (team.players || []).map(p => p.id).join("|");
            return `${pos}:${amount}:${pids}`;
        }).join(",");
    }, [rankings, placementCount, baseDist]);

    // Fetch tax preview (only in detailed tab, and only if not already declared)
    const { data: taxPreviewRes, isLoading: taxLoading } = useQuery<{
        data: TaxPreviewData;
        taxTotals?: { totalTax: number; orgContribution: number; fundContribution: number };
        soloTaxTotal?: number;
        finalOrg?: number;
        finalFund?: number;
        storedPlayerAmounts?: Record<string, number>;
    }>({
        queryKey: ["tax-preview", tournamentId, topTeamPlayerIds.join(","), placementsParam],
        queryFn: async () => {
            let url = `/api/tournaments/${tournamentId}/tax-preview?playerIds=${topTeamPlayerIds.join(",")}`;
            if (placementsParam) url += `&placements=${encodeURIComponent(placementsParam)}`;
            const res = await fetch(url);
            if (!res.ok) return { data: {} };
            return res.json();
        },
        enabled: isOpen && activeTab === "detailed" && topTeamPlayerIds.length > 0,
    });

    // Fetch stored results when already declared (no recalculation)
    const { data: storedResults } = useQuery<{ playerId: string; amount: number; position: number }[]>({
        queryKey: ["stored-winner-rewards", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/tournaments/${tournamentId}/stored-results`);
            if (!res.ok) return [];
            const json = await res.json();
            return json.data ?? [];
        },
        enabled: isOpen && isWinnerDeclared,
    });

    // Map of playerId -> stored amount (for display when already declared)
    const storedAmounts = useMemo(() => {
        const map = new Map<string, number>();
        if (storedResults) {
            for (const r of storedResults) map.set(r.playerId, r.amount);
        }
        return map;
    }, [storedResults]);

    // Dry-run declare-winners to get exact Org/Fund that would be stored
    const { data: dryRunRes } = useQuery<{
        data?: {
            finalOrg: number;
            finalFund: number;
            breakdown?: {
                orgBase: number;
                fundBase: number;
                ucExemptCost: number;
                orgAfterExempt: number;
                orgTaxContribution: number;
                fundTaxContribution: number;
                totalRepeatTax: number;
            };
        };
    }>({
        queryKey: ["declare-dryrun", tournamentId, placementsParam],
        queryFn: async () => {
            if (!baseDist) return {};
            const placements = Array.from({ length: placementCount }, (_, i) => ({
                position: i + 1, amount: baseDist.prizes.get(i + 1)?.amount ?? 0,
            }));
            const res = await fetch(`/api/tournaments/${tournamentId}/declare-winners`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placements, dryRun: true }),
            });
            if (!res.ok) return {};
            return res.json();
        },
        enabled: isOpen && activeTab === "detailed" && !!baseDist && placementCount > 0 && !isWinnerDeclared,
    });

    const taxPreview = taxPreviewRes?.data || {};
    const storedPlayerAmounts: Record<string, number> = taxPreviewRes?.storedPlayerAmounts || {};

    // Helper: per-player base amount
    const getPerPlayerAmount = (position: number, playerCount: number) => {
        if (playerCount === 0) return 0;
        return Math.floor((baseDist?.prizes.get(position)?.amount ?? 0) / playerCount);
    };

    // Helper: participation-adjusted amounts
    const getParticipationAdjustedAmounts = (
        players: { id: string; name: string }[], basePerPlayer: number
    ) => {
        const result = new Map<string, {
            base: number; adjusted: number; bonus: number; penalty: number;
            matchesPlayed: number; totalMatches: number; rate: number;
        }>();
        if (players.length === 0 || basePerPlayer === 0) return result;

        const rates = players.map(p => {
            const tax = taxPreview[p.id];
            return { id: p.id, rate: tax?.participationRate ?? 1, matchesPlayed: tax?.matchesPlayed ?? 0, totalMatches: tax?.totalMatches ?? 1 };
        });
        const first = rates[0];
        if (!first || first.totalMatches === 0) {
            for (const p of players) result.set(p.id, { base: basePerPlayer, adjusted: basePerPlayer, bonus: 0, penalty: 0, matchesPlayed: 0, totalMatches: 0, rate: 1 });
            return result;
        }
        const avgRate = rates.reduce((s, r) => s + r.rate, 0) / players.length;
        for (const r of rates) {
            const adj = Math.floor((r.rate - avgRate) * basePerPlayer * SOFTENING_FACTOR);
            result.set(r.id, { base: basePerPlayer, adjusted: basePerPlayer + adj, bonus: adj > 0 ? adj : 0, penalty: adj < 0 ? -adj : 0, matchesPlayed: r.matchesPlayed, totalMatches: r.totalMatches, rate: r.rate });
        }
        return result;
    };

    // Helper: tax-adjusted amount (uses stored amount when available)
    const getTaxedAmount = (playerId: string, baseAmount: number) => {
        // If tournament is declared and we have stored amounts, use those directly
        if (isWinnerDeclared && storedPlayerAmounts[playerId] !== undefined) {
            return storedPlayerAmounts[playerId];
        }
        const tax = taxPreview[playerId];
        if (!tax || tax.taxRate === 0) return baseAmount;
        return Math.floor(baseAmount * (1 - tax.taxRate));
    };

    // Tax totals from backend (exact same logic as declare-winners)
    const taxTotals = useMemo(() => {
        const bt = taxPreviewRes?.taxTotals;
        const soloTotal = taxPreviewRes?.soloTaxTotal ?? 0;
        if (!bt || activeTab !== "detailed") return { total: 0, repeatTax: 0, soloTax: 0, fundContribution: 0, orgContribution: 0, soloToLosers: 0, soloToPool: 0 };
        return {
            total: bt.totalTax + soloTotal,
            repeatTax: bt.totalTax,
            soloTax: soloTotal,
            fundContribution: bt.fundContribution,
            orgContribution: bt.orgContribution,
            soloToLosers: Math.floor(soloTotal * 0.60),
            soloToPool: Math.ceil(soloTotal * 0.40),
        };
    }, [taxPreviewRes, activeTab]);

    const organizerAmount = distribution?.finalOrgAmount ?? 0;
    // Declare: runs all 3 steps (declare → streaks → process rewards)
    const [declareStatus, setDeclareStatus] = useState<{
        step: string;
        error?: string;
        done?: boolean;
    } | null>(null);

    const declare = useMutation({
        mutationFn: async () => {
            // Step 1: Declare winners
            setDeclareStatus({ step: "Declaring winners..." });

            // Build placements with exact per-player amounts from preview
            const placements = rankings.slice(0, placementCount).map((team, i) => {
                const pos = i + 1;
                const teamAmount = baseDist?.prizes.get(pos)?.amount ?? 0;
                const playerCount = team.players?.length || 0;
                const perPlayer = getPerPlayerAmount(pos, playerCount);

                // Compute exact per-player amounts using preview helpers
                const pa = getParticipationAdjustedAmounts(team.players || [], perPlayer);
                const players = (team.players || []).map(p => {
                    const adjusted = pa.get(p.id)?.adjusted ?? perPlayer;
                    const final = getTaxedAmount(p.id, adjusted);
                    return { playerId: p.id, amount: final };
                });

                return { position: pos, amount: teamAmount, teamId: team.teamId, players };
            });

            const res1 = await fetch(`/api/tournaments/${tournamentId}/declare-winners`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ placements }),
            });
            if (!res1.ok) { const d = await res1.json(); throw new Error(d.error || "Declare failed"); }

            // Step 2: Update streaks
            setDeclareStatus({ step: "Updating streaks..." });
            const res2 = await fetch(`/api/tournaments/${tournamentId}/update-streaks`, { method: "POST" });
            if (!res2.ok) {
                const d = await res2.json();
                setDeclareStatus({ step: "Streaks failed", error: d.error || "Unknown error" });
                // Don't throw — declaration succeeded, just log the error
            }

            // Step 3: Process rewards (merit + referrals)
            setDeclareStatus({ step: "Processing rewards..." });
            const res3 = await fetch(`/api/tournaments/${tournamentId}/post-declare`, { method: "POST" });
            if (!res3.ok) {
                const d = await res3.json();
                setDeclareStatus({ step: "Rewards failed", error: d.error || "Unknown error" });
            }
        },
        onSuccess: async () => {
            setDeclareStatus({ step: "Done!", done: true });
            toast.success("Winners declared, streaks updated & rewards processed!");
            await queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
            await queryClient.invalidateQueries({ queryKey: ["tournament-rankings"] });
            queryClient.invalidateQueries({ queryKey: ["solo-tax-pool"] });
            setTimeout(() => { setDeclareStatus(null); onClose(); }, 1000);
        },
        onError: (err: Error) => {
            setDeclareStatus({ step: "Failed", error: err.message });
        },
    });

    // Undo mutation
    const undo = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/tournaments/${tournamentId}/undo-winner`, { method: "POST" });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
        },
        onSuccess: async () => {
            toast.success("Winner declaration undone!");
            await queryClient.invalidateQueries({ queryKey: ["admin-tournaments"] });
            await queryClient.invalidateQueries({ queryKey: ["tournament-rankings"] });
            queryClient.invalidateQueries({ queryKey: ["solo-tax-pool"] });
            onClose();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // ─── Render helpers ──────────────────────────────────────
    const renderTeamCard = (team: TeamRanking, idx: number, detailed: boolean) => {
        const playerCount = team.players?.length || 0;
        const teamPrize = baseDist?.prizes.get(idx + 1)?.amount ?? 0;
        const perPlayer = getPerPlayerAmount(idx + 1, playerCount);

        return (
            <div
                key={team.teamId}
                className={`rounded-lg border p-3 ${idx === 0 ? "border-warning/40 bg-warning/[0.04]" :
                    idx === 1 ? "border-foreground/15 bg-foreground/[0.02]" :
                        idx === 2 ? "border-orange-500/30 bg-orange-500/[0.03]" :
                            "border-divider"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{getMedal(idx)}</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {team.players?.map(p => p.name).join(", ") || team.name || "No players"}
                        </p>
                        <p className="text-xs text-foreground/40">
                            {team.total} pts • {team.kills} kills
                        </p>
                    </div>
                    {teamPrize > 0 && (
                        <div className="text-right shrink-0">
                            <Chip size="sm" color="success" variant="flat" className="font-semibold">
                                ₹{teamPrize.toLocaleString()}
                            </Chip>
                            {playerCount > 1 && (
                                <p className="text-[10px] text-foreground/30 mt-0.5">₹{perPlayer}/player</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Per-player details (detailed tab only) */}
                {detailed && teamPrize > 0 && playerCount > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed border-divider space-y-1.5">
                        {taxLoading && !isWinnerDeclared ? (
                            <div className="flex justify-center py-1"><Spinner size="sm" /></div>
                        ) : (
                            team.players?.map(p => {
                                // If already declared, use stored amounts from DB
                                if (isWinnerDeclared && storedAmounts.size > 0) {
                                    const stored = storedAmounts.get(p.id);
                                    if (stored !== undefined) {
                                        return (
                                            <div key={p.id} className="text-xs space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-medium">{p.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-foreground/50">
                                                    <span>₹{perPlayer} →</span>
                                                    <span className="font-semibold text-foreground">₹{stored}</span>
                                                </div>
                                            </div>
                                        );
                                    }
                                }

                                // Preview mode: calculate from tax preview
                                const tax = taxPreview[p.id];
                                const pa = getParticipationAdjustedAmounts(team.players || [], perPlayer).get(p.id);
                                const afterParticipation = pa?.adjusted ?? perPlayer;
                                const finalAmount = getTaxedAmount(p.id, afterParticipation);
                                const taxDeduction = afterParticipation - finalAmount;

                                return (
                                    <div key={p.id} className="text-xs space-y-0.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-medium">{p.name}</span>
                                            {pa && pa.totalMatches > 0 && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pa.rate >= 1 ? "bg-success/10 text-success" :
                                                    pa.rate >= 0.5 ? "bg-warning/10 text-warning" :
                                                        "bg-danger/10 text-danger"
                                                    }`}>
                                                    {pa.matchesPlayed}/{pa.totalMatches} matches
                                                </span>
                                            )}
                                            {tax?.isSolo && (
                                                <span className="bg-secondary/10 text-secondary px-1.5 py-0.5 rounded text-[10px] font-medium">SOLO</span>
                                            )}
                                            {tax?.repeatWinnerTaxRate && tax.repeatWinnerTaxRate > 0 && (
                                                <span className="text-warning text-[10px]">🔄 {tax.totalWins} wins</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-foreground/50">
                                            <div className="flex items-center gap-1">
                                                <span>₹{perPlayer}</span>
                                                {pa && pa.bonus > 0 && <span className="text-success">+{pa.bonus}</span>}
                                                {pa && pa.penalty > 0 && <span className="text-warning">-{pa.penalty}</span>}
                                                {taxDeduction > 0 && <span className="text-danger">-{taxDeduction} tax</span>}
                                                <span className="mx-0.5">→</span>
                                            </div>
                                            <span className={`font-semibold ${pa && pa.bonus > 0 ? "text-success" :
                                                pa && pa.penalty > 0 ? "text-warning" :
                                                    "text-foreground"
                                                }`}>
                                                ₹{finalAmount}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} placement="center" size="lg" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    <div>
                        <p>{isWinnerDeclared ? "Tournament Results" : "Declare Winners & Distribute UC"}</p>
                        <p className="text-xs font-normal text-foreground/50">{tournamentName}</p>
                    </div>
                </ModalHeader>

                <ModalBody className="gap-3">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Spinner /></div>
                    ) : rankings.length === 0 ? (
                        <div className="text-center py-8 text-foreground/40 text-sm">
                            No team stats found for this tournament.
                        </div>
                    ) : (
                        <>
                            {/* Tabs: Simple / Detailed */}
                            <Tabs
                                selectedKey={activeTab}
                                onSelectionChange={(key) => setActiveTab(key as string)}
                                variant="bordered"
                                size="sm"
                                fullWidth
                                classNames={{ tabList: "w-full" }}
                            >
                                <Tab key="simple" title="Simple" />
                                <Tab key="detailed" title="Detailed Preview" />
                            </Tabs>

                            {/* ─ Prize Pool (Detailed only) ─ */}
                            {activeTab === "detailed" && prizePool > 0 && baseDist && distribution && (
                                <div className="rounded-lg border border-success/30 bg-gradient-to-br from-success/5 to-success/10">
                                    <button
                                        onClick={() => setPoolOpen(!poolOpen)}
                                        className="w-full p-3 flex items-center justify-between hover:bg-success/5 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Coins className="h-4 w-4 text-success" />
                                            <span className="font-semibold text-success text-sm">Prize Pool</span>
                                            <Chip size="sm" color="success" variant="flat">₹{prizePool.toLocaleString()}</Chip>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-foreground/30 transition-transform duration-200 ${poolOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    {poolOpen && (
                                        <div className="px-4 pb-3 space-y-2">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                <span className="text-foreground/40">Entry Fee:</span>
                                                <span className="font-medium">₹{entryFee}</span>
                                                <span className="text-foreground/40">Players:</span>
                                                <span className="font-medium">{totalPlayers}</span>
                                                {bonusPool > 0 && (
                                                    <>
                                                        <span className="text-foreground/40">Base Pool:</span>
                                                        <span className="font-medium">₹{basePrizePool.toLocaleString()}</span>
                                                        <span className="text-foreground/40">🎁 Bonus:</span>
                                                        <span className="font-medium text-secondary">+₹{bonusPool.toLocaleString()}</span>
                                                    </>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-success/20 space-y-0.5 text-xs">
                                                {Array.from(baseDist.prizes.entries())
                                                    .sort(([a], [b]) => a - b)
                                                    .map(([pos, prize]) => {
                                                        const team = rankings[pos - 1];
                                                        let teamTax = 0;
                                                        if (team?.players) {
                                                            const perPlayer = getPerPlayerAmount(pos, team.players.length);
                                                            const pa = getParticipationAdjustedAmounts(team.players, perPlayer);
                                                            team.players.forEach(p => {
                                                                const tax = taxPreview[p.id];
                                                                if (tax) {
                                                                    const adj = pa.get(p.id)?.adjusted ?? perPlayer;
                                                                    if (tax.repeatWinnerTaxRate > 0) teamTax += Math.floor(adj * tax.repeatWinnerTaxRate);
                                                                    if (tax.soloTaxRate > 0) teamTax += Math.floor(adj * tax.soloTaxRate);
                                                                }
                                                            });
                                                        }
                                                        const label = prize.isFixed ? `${getOrdinal(pos)} (refund)` : `${getOrdinal(pos)} (${prize.percentage}%)`;
                                                        return (
                                                            <div key={pos} className="flex justify-between">
                                                                <span>{getMedal(pos - 1)} {label}:</span>
                                                                <span className="font-medium">
                                                                    {teamTax > 0 ? (
                                                                        <>
                                                                            <span className="text-foreground/30 line-through mr-1">₹{prize.amount.toLocaleString()}</span>
                                                                            <span className="text-warning">-₹{teamTax}</span>
                                                                            <span className="mx-0.5">=</span>
                                                                            <span>₹{(prize.amount - teamTax).toLocaleString()}</span>
                                                                        </>
                                                                    ) : <>₹{prize.amount.toLocaleString()}</>}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}

                                                <div className="flex justify-between text-foreground/50">
                                                    <span>💼 Org ({baseDist.tier.orgFeePercent}%):</span>
                                                    <span className="font-medium text-foreground">
                                                        {(() => {
                                                            const bd = dryRunRes?.data?.breakdown;
                                                            const final = dryRunRes?.data?.finalOrg ?? taxPreviewRes?.finalOrg ?? organizerAmount;
                                                            if (!bd) return <>₹{final.toLocaleString()}</>;
                                                            const parts: React.ReactNode[] = [];
                                                            parts.push(<span key="base" className="text-foreground/30">₹{bd.orgBase}</span>);
                                                            if (bd.ucExemptCost > 0) parts.push(<span key="ex" className="text-danger"> -₹{bd.ucExemptCost}</span>);
                                                            if (bd.orgTaxContribution > 0) parts.push(<span key="tax" className="text-success"> +₹{bd.orgTaxContribution}</span>);
                                                            parts.push(<span key="eq" className="mx-0.5">=</span>);
                                                            parts.push(<span key="tot">₹{final.toLocaleString()}</span>);
                                                            return <>{parts}</>;
                                                        })()}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-foreground/50">
                                                    <span>🏦 Fund ({baseDist.tier.fundPercent}%):</span>
                                                    <span className="font-medium text-foreground">
                                                        {(() => {
                                                            const bd = dryRunRes?.data?.breakdown;
                                                            const final = dryRunRes?.data?.finalFund ?? taxPreviewRes?.finalFund ?? distribution.finalFundAmount;
                                                            if (!bd) return <>₹{final.toLocaleString()}</>;
                                                            const parts: React.ReactNode[] = [];
                                                            parts.push(<span key="base" className="text-foreground/30">₹{bd.fundBase}</span>);
                                                            if (bd.fundTaxContribution > 0) parts.push(<span key="tax" className="text-success"> +₹{bd.fundTaxContribution}</span>);
                                                            parts.push(<span key="eq" className="mx-0.5">=</span>);
                                                            parts.push(<span key="tot">₹{final.toLocaleString()}</span>);
                                                            return <>{parts}</>;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>

                                            {taxTotals.total > 0 && (
                                                <div className="mt-2 pt-2 border-t border-dashed border-success/20 space-y-1 opacity-80 italic">
                                                    {taxTotals.repeatTax > 0 && (
                                                        <p className="text-[10px] text-warning">
                                                            Note: ₹{taxTotals.repeatTax} Repeat Winner Tax → Org (₹{taxTotals.orgContribution}) & Fund (₹{taxTotals.fundContribution}).
                                                        </p>
                                                    )}
                                                    {taxTotals.soloTax > 0 && (
                                                        <p className="text-[10px] text-secondary">
                                                            Note: ₹{taxTotals.soloTax} Solo Tax → Loser Support (₹{taxTotals.soloToLosers}) & Next Pool (₹{taxTotals.soloToPool}).
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─ Simple tab: just show prize pool chip ─ */}
                            {activeTab === "simple" && basePrizePool > 0 && baseDist && (
                                <div className="flex items-center gap-2 text-sm text-foreground/60">
                                    <Coins className="h-4 w-4 text-success" />
                                    <span>Prize Pool:</span>
                                    <Chip size="sm" color="success" variant="flat" className="font-semibold">
                                        ₹{basePrizePool.toLocaleString()}
                                    </Chip>
                                    <span className="text-xs text-foreground/30">
                                        ({baseDist.tier.winnerCount} winners)
                                    </span>
                                </div>
                            )}

                            {/* ─ Team Rankings ─ */}
                            <div>
                                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">
                                    Rankings (Top {placementCount})
                                </p>
                                <div className="space-y-2">
                                    {rankings.slice(0, placementCount).map((team, idx) =>
                                        renderTeamCard(team, idx, activeTab === "detailed")
                                    )}
                                </div>
                            </div>

                            {/* Add/Remove placement controls */}
                            {!isWinnerDeclared && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {placementCount < rankings.length && placementCount < 10 && (
                                        <Button size="sm" variant="flat" startContent={<Plus className="h-3.5 w-3.5" />}
                                            onPress={() => setPlacementCount(c => c + 1)} className="gap-1 text-xs h-8">
                                            Add {getOrdinal(placementCount + 1)} Place
                                        </Button>
                                    )}
                                    {placementCount > 2 && (
                                        <Button size="sm" variant="flat" color="danger" startContent={<Trash2 className="h-3.5 w-3.5" />}
                                            onPress={() => setPlacementCount(c => c - 1)} className="gap-1 text-xs h-8">
                                            Remove {getOrdinal(placementCount)} Place
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </ModalBody>

                <ModalFooter className="flex-col items-stretch gap-2">
                    {declareStatus && (
                        <div className={`text-xs text-center px-3 py-1.5 rounded-lg ${declareStatus.error ? "bg-danger/10 text-danger" :
                            declareStatus.done ? "bg-success/10 text-success" :
                                "bg-warning/10 text-warning"
                            }`}>
                            {declareStatus.done ? "✅ " : declareStatus.error ? "❌ " : "⏳ "}
                            {declareStatus.step}
                            {declareStatus.error && <span className="block text-[10px] opacity-80 mt-0.5">{declareStatus.error}</span>}
                        </div>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button variant="flat" onPress={onClose}>Close</Button>
                        {isWinnerDeclared ? (
                            <Button color="danger" variant="flat" isLoading={undo.isPending}
                                startContent={<Undo2 className="h-4 w-4" />}
                                onPress={() => { if (confirm("Undo winner declaration? This will reverse UC transactions.")) undo.mutate(); }}>
                                Undo Declaration
                            </Button>
                        ) : (
                            <Button className="bg-gradient-to-r from-warning to-[#f97316] text-white font-semibold"
                                isLoading={declare.isPending} isDisabled={rankings.length === 0}
                                startContent={<Trophy className="h-4 w-4" />}
                                onPress={() => declare.mutate()}>
                                {declare.isPending ? (declareStatus?.step || "Processing...") : prizePool > 0 ? "Declare & Distribute" : "Declare Winners"}
                            </Button>
                        )}
                    </div>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
