"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Skeleton,
    Divider,
    Chip,
} from "@heroui/react";
import {
    ArrowRightLeft,
    AlertCircle,
    Check,
    X,
    TrendingUp,
    TrendingDown,
    Scale,
    Clock,
    Send,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { GAME } from "@/lib/game-config";

// ─── Types ──────────────────────────────────────────────────

interface PendingRequest {
    id: string;
    requestedByGame: string;
    netAmount: number;
    transferCount: number;
    requestedAt: string;
    needsMyConfirmation: boolean;
}

interface GamePair {
    otherGame: string;
    otherGameName: string;
    outgoing: number;
    incoming: number;
    net: number;
    transferCount: number;
    pendingRequest: PendingRequest | null;
}

interface GameSummary {
    game: string;
    gameName: string;
    pairs: GamePair[];
}

interface SettlementData {
    summary: GameSummary[];
    totalTransfers: number;
    currentGame: string;
}

// ─── Game icons ─────────────────────────────────────────────

const GAME_ICONS: Record<string, string> = {
    bgmi: "/icons/bgmi/icon-192x192.png",
    pes: "/icons/pes/icon-192x192.png",
    freefire: "/icons/freefire/icon-192x192.png",
    mlbb: "/icons/mlbb/icon-192x192.png",
};

// ─── Component ──────────────────────────────────────────────

export default function SettlementPage() {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<SettlementData>({
        queryKey: ["cross-game-settlement"],
        queryFn: async () => {
            const res = await fetch("/api/cross-game/settlement");
            if (!res.ok) throw new Error("Failed to fetch settlement data");
            const json = await res.json();
            return json.data;
        },
        staleTime: 30_000,
    });

    const requestSettle = useMutation({
        mutationFn: async (otherGame: string) => {
            const res = await fetch("/api/cross-game/settlement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "request", otherGame }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["cross-game-settlement"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const confirmSettle = useMutation({
        mutationFn: async (requestId: string) => {
            const res = await fetch("/api/cross-game/settlement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "confirm", requestId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["cross-game-settlement"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const rejectSettle = useMutation({
        mutationFn: async (requestId: string) => {
            const res = await fetch("/api/cross-game/settlement", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reject", requestId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ["cross-game-settlement"] });
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const currentGameSummary = data?.summary.find((s) => s.game === data.currentGame);
    const otherGameSummaries = data?.summary.filter((s) => s.game !== data.currentGame) ?? [];
    const isPending = requestSettle.isPending || confirmSettle.isPending || rejectSettle.isPending;

    return (
        <div className="space-y-5 p-4">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold">Cross-Game Settlement</h1>
                </div>
                <p className="text-xs text-foreground/40 mt-0.5">
                    Track and settle currency transfers between game managers
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-4 text-sm text-danger dark:bg-danger-50/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Failed to load settlement data.
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
            ) : data ? (
                <>
                    {/* Overview card */}
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="border border-divider bg-gradient-to-br from-primary/5 to-secondary/5">
                            <CardBody className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-wider text-foreground/40">
                                            Unsettled Transfers
                                        </p>
                                        <p className="text-2xl font-bold mt-1">{data.totalTransfers}</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                                        <ArrowRightLeft className="h-6 w-6 text-primary" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </motion.div>

                    {/* Current game settlement */}
                    {currentGameSummary && currentGameSummary.pairs.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <Card className="border border-divider">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={GAME_ICONS[data.currentGame] ?? ""}
                                            alt={GAME.gameName}
                                            className="h-6 w-6 rounded-lg"
                                        />
                                        <h3 className="text-sm font-bold">{GAME.gameName} Settlement</h3>
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody className="p-0">
                                    {currentGameSummary.pairs.map((pair, i) => (
                                        <div
                                            key={pair.otherGame}
                                            className={`p-4 ${i < currentGameSummary.pairs.length - 1 ? "border-b border-divider" : ""}`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={GAME_ICONS[pair.otherGame] ?? ""}
                                                        alt={pair.otherGameName}
                                                        className="h-5 w-5 rounded-md"
                                                    />
                                                    <span className="text-sm font-semibold">{pair.otherGameName}</span>
                                                    <Chip size="sm" variant="flat" className="text-[10px]">
                                                        {pair.transferCount} transfers
                                                    </Chip>
                                                </div>
                                            </div>

                                            {/* Flow details */}
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                <div className="rounded-lg bg-danger/10 p-2 text-center">
                                                    <TrendingUp className="h-3 w-3 text-danger mx-auto mb-0.5" />
                                                    <p className="text-[10px] text-foreground/40">Outgoing</p>
                                                    <p className="text-sm font-bold text-danger">{pair.outgoing}</p>
                                                </div>
                                                <div className="rounded-lg bg-success/10 p-2 text-center">
                                                    <TrendingDown className="h-3 w-3 text-success mx-auto mb-0.5" />
                                                    <p className="text-[10px] text-foreground/40">Incoming</p>
                                                    <p className="text-sm font-bold text-success">{pair.incoming}</p>
                                                </div>
                                                <div className={`rounded-lg p-2 text-center ${pair.net >= 0 ? "bg-success/10" : "bg-danger/10"}`}>
                                                    <Scale className={`h-3 w-3 mx-auto mb-0.5 ${pair.net >= 0 ? "text-success" : "text-danger"}`} />
                                                    <p className="text-[10px] text-foreground/40">Net</p>
                                                    <p className={`text-sm font-bold ${pair.net >= 0 ? "text-success" : "text-danger"}`}>
                                                        {pair.net >= 0 ? "+" : ""}{pair.net}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Net summary */}
                                            <div className={`rounded-lg px-3 py-2 text-xs font-medium ${pair.net >= 0
                                                ? "bg-success/10 text-success"
                                                : "bg-warning/10 text-warning"
                                            }`}>
                                                {pair.net > 0
                                                    ? `${pair.otherGameName} owes you ${pair.net} ${GAME.currency}`
                                                    : pair.net < 0
                                                        ? `You owe ${pair.otherGameName} ${Math.abs(pair.net)} ${GAME.currency}`
                                                        : "Balanced — no settlement needed"}
                                            </div>

                                            {/* Settlement actions */}
                                            {pair.transferCount > 0 && (
                                                <div className="mt-3">
                                                    {/* No pending request — show "Request Settlement" */}
                                                    {!pair.pendingRequest && (
                                                        <Button
                                                            size="sm"
                                                            color="primary"
                                                            variant="flat"
                                                            className="w-full font-semibold"
                                                            isLoading={isPending}
                                                            startContent={!isPending && <Send className="h-3.5 w-3.5" />}
                                                            onPress={() => requestSettle.mutate(pair.otherGame)}
                                                        >
                                                            Request Settlement
                                                        </Button>
                                                    )}

                                                    {/* We requested, waiting for their confirmation */}
                                                    {pair.pendingRequest && !pair.pendingRequest.needsMyConfirmation && (
                                                        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
                                                            <Clock className="h-3.5 w-3.5 text-warning shrink-0" />
                                                            <p className="text-[11px] font-medium text-warning">
                                                                Waiting for {pair.otherGameName} to confirm
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* They requested, we need to confirm */}
                                                    {pair.pendingRequest?.needsMyConfirmation && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                                                                <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                                                                <p className="text-[11px] font-medium text-primary">
                                                                    {pair.otherGameName} requested settlement
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    color="danger"
                                                                    variant="flat"
                                                                    className="flex-1 font-semibold"
                                                                    isDisabled={isPending}
                                                                    startContent={<X className="h-3.5 w-3.5" />}
                                                                    onPress={() => rejectSettle.mutate(pair.pendingRequest!.id)}
                                                                >
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    color="success"
                                                                    className="flex-1 font-semibold"
                                                                    isLoading={confirmSettle.isPending}
                                                                    startContent={!confirmSettle.isPending && <Check className="h-3.5 w-3.5" />}
                                                                    onPress={() => confirmSettle.mutate(pair.pendingRequest!.id)}
                                                                >
                                                                    Confirm Settled
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </CardBody>
                            </Card>
                        </motion.div>
                    )}

                    {/* Other games (read-only) */}
                    {otherGameSummaries.map((gameSummary, idx) => (
                        <motion.div
                            key={gameSummary.game}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.05 }}
                        >
                            <Card className="border border-divider opacity-80">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={GAME_ICONS[gameSummary.game] ?? ""}
                                            alt={gameSummary.gameName}
                                            className="h-5 w-5 rounded-lg"
                                        />
                                        <h3 className="text-sm font-semibold text-foreground/60">{gameSummary.gameName}</h3>
                                        <Chip size="sm" variant="flat" color="default" className="text-[10px]">
                                            Other game
                                        </Chip>
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody className="p-0">
                                    {gameSummary.pairs.map((pair, i) => (
                                        <div
                                            key={pair.otherGame}
                                            className={`flex items-center justify-between p-3 ${i < gameSummary.pairs.length - 1 ? "border-b border-divider" : ""}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={GAME_ICONS[pair.otherGame] ?? ""}
                                                    alt={pair.otherGameName}
                                                    className="h-4 w-4 rounded-md"
                                                />
                                                <span className="text-xs">{pair.otherGameName}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs font-bold ${pair.net >= 0 ? "text-success" : "text-danger"}`}>
                                                    {pair.net >= 0 ? "+" : ""}{pair.net}
                                                </p>
                                                <p className="text-[10px] text-foreground/40">{pair.transferCount} transfers</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardBody>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Empty state */}
                    {data.totalTransfers === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center gap-2 py-12 text-center"
                        >
                            <Check className="h-10 w-10 text-success/40" />
                            <p className="text-sm font-medium text-foreground/50">All settled!</p>
                            <p className="text-xs text-foreground/30">No pending cross-game transfers</p>
                        </motion.div>
                    )}
                </>
            ) : null}
        </div>
    );
}
