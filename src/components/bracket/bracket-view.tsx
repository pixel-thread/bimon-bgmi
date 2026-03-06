"use client";

import { Avatar, Card, CardBody, Chip, Spinner } from "@heroui/react";
import { Trophy, Clock, AlertTriangle, CheckCircle2, Minus, Eye } from "lucide-react";
import { motion } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────────── */

interface BracketPlayer {
    id: string;
    displayName: string | null;
    userId: string;
}

interface BracketMatchResult {
    id: string;
    submittedById: string;
    claimedScore1: number;
    claimedScore2: number;
    screenshotUrl: string | null;
    isDispute: boolean;
    createdAt: string;
}

interface BracketMatchData {
    id: string;
    round: number;
    position: number;
    player1Id: string | null;
    player2Id: string | null;
    winnerId: string | null;
    score1: number | null;
    score2: number | null;
    status: "PENDING" | "SUBMITTED" | "DISPUTED" | "CONFIRMED" | "BYE";
    disputeDeadline: string | null;
    player1: BracketPlayer | null;
    player2: BracketPlayer | null;
    player1Avatar: string | null;
    player2Avatar: string | null;
    winner: { id: string; displayName: string | null } | null;
    results: BracketMatchResult[];
}

interface RoundData {
    round: number;
    name: string;
    matches: BracketMatchData[];
}

interface BracketViewProps {
    rounds: RoundData[];
    totalRounds: number;
    currentPlayerId?: string;
    onSubmitResult?: (matchId: string) => void;
    onConfirmResult?: (matchId: string) => void;
    onDispute?: (matchId: string) => void;
    onViewResult?: (matchId: string) => void;
}

/* ─── Status Colors ─────────────────────────────────────────── */

function statusConfig(status: BracketMatchData["status"]) {
    switch (status) {
        case "PENDING": return { color: "default" as const, icon: Clock, label: "Pending" };
        case "SUBMITTED": return { color: "warning" as const, icon: Clock, label: "Awaiting Confirmation" };
        case "DISPUTED": return { color: "danger" as const, icon: AlertTriangle, label: "Disputed" };
        case "CONFIRMED": return { color: "success" as const, icon: CheckCircle2, label: "Confirmed" };
        case "BYE": return { color: "secondary" as const, icon: Minus, label: "Bye" };
    }
}

/* ─── Player Slot ───────────────────────────────────────────── */

function PlayerSlot({
    player,
    avatar,
    score,
    isWinner,
    isCurrent,
    isBye,
}: {
    player: BracketPlayer | null;
    avatar: string | null;
    score: number | null;
    isWinner: boolean;
    isCurrent: boolean;
    isBye: boolean;
}) {
    if (!player) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-default-100/50">
                <div className="h-6 w-6 rounded-full bg-default-200" />
                <span className="text-xs text-foreground/30 italic">TBD</span>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isWinner
                ? "bg-success-50 dark:bg-success-50/10 border border-success-200 dark:border-success-800"
                : isCurrent
                    ? "bg-primary-50 dark:bg-primary-50/10 border border-primary-200 dark:border-primary-800"
                    : "bg-default-100/50"
                }`}
        >
            <Avatar
                src={avatar || undefined}
                name={player.displayName?.[0] || "?"}
                size="sm"
                className="h-6 w-6 text-tiny"
            />
            <span className={`text-xs font-medium flex-1 truncate ${isWinner ? "text-success-700 dark:text-success-400" : ""}`}>
                {player.displayName || "Unknown"}
                {isCurrent && <span className="text-primary text-[10px] ml-1">(You)</span>}
            </span>
            {score !== null && (
                <span className={`text-sm font-bold tabular-nums ${isWinner ? "text-success-600 dark:text-success-400" : "text-foreground/60"}`}>
                    {score}
                </span>
            )}
            {isWinner && <Trophy className="h-3.5 w-3.5 text-success-500 shrink-0" />}
            {isBye && <Chip size="sm" variant="flat" color="secondary" className="text-[10px] h-4">BYE</Chip>}
        </div>
    );
}

/* ─── Single Match Card ─────────────────────────────────────── */

function MatchCard({
    match,
    currentPlayerId,
    onSubmitResult,
    onConfirmResult,
    onDispute,
    onViewResult,
}: {
    match: BracketMatchData;
    currentPlayerId?: string;
    onSubmitResult?: (matchId: string) => void;
    onConfirmResult?: (matchId: string) => void;
    onDispute?: (matchId: string) => void;
    onViewResult?: (matchId: string) => void;
}) {
    const config = statusConfig(match.status);
    const StatusIcon = config.icon;

    const isCurrentP1 = currentPlayerId === match.player1Id;
    const isCurrentP2 = currentPlayerId === match.player2Id;
    const isParticipant = isCurrentP1 || isCurrentP2;

    // Can this player act?
    const canSubmit = isParticipant && match.status === "PENDING" && match.player1Id && match.player2Id;
    const canConfirm = isParticipant && match.status === "SUBMITTED" && match.winnerId !== currentPlayerId;
    const canDispute = isParticipant && match.status === "SUBMITTED" && match.winnerId !== currentPlayerId;
    const hasResult = match.status === "CONFIRMED" || match.status === "SUBMITTED";

    return (
        <Card
            className={`border transition-all ${isParticipant && match.status === "PENDING" && match.player1Id && match.player2Id
                ? "border-primary shadow-md shadow-primary/10"
                : "border-divider"
                }`}
        >
            <CardBody className="p-3 space-y-2">
                {/* Players */}
                <PlayerSlot
                    player={match.player1}
                    avatar={match.player1Avatar}
                    score={match.score1}
                    isWinner={match.winnerId === match.player1Id}
                    isCurrent={isCurrentP1}
                    isBye={match.status === "BYE" && !match.player2Id}
                />
                <div className="flex items-center gap-2 px-2">
                    <div className="flex-1 h-px bg-divider" />
                    <span className="text-[10px] text-foreground/30 font-medium">VS</span>
                    <div className="flex-1 h-px bg-divider" />
                </div>
                <PlayerSlot
                    player={match.player2}
                    avatar={match.player2Avatar}
                    score={match.score2}
                    isWinner={match.winnerId === match.player2Id}
                    isCurrent={isCurrentP2}
                    isBye={match.status === "BYE" && !match.player1Id}
                />

                {/* Status */}
                <div className="flex items-center justify-between pt-1">
                    <Chip
                        size="sm"
                        variant="flat"
                        color={config.color}
                        startContent={<StatusIcon className="h-3 w-3" />}
                        className="text-[10px]"
                    >
                        {config.label}
                    </Chip>

                    {/* Action buttons */}
                    {canSubmit && onSubmitResult && (
                        <button
                            onClick={() => onSubmitResult(match.id)}
                            className="text-[11px] font-semibold text-primary hover:text-primary-600 transition-colors"
                        >
                            Submit Result →
                        </button>
                    )}
                    {canConfirm && onConfirmResult && (
                        <button
                            onClick={() => onConfirmResult(match.id)}
                            className="text-[11px] font-semibold text-success hover:text-success-600 transition-colors"
                        >
                            ✓ Confirm
                        </button>
                    )}
                    {canDispute && onDispute && (
                        <button
                            onClick={() => onDispute(match.id)}
                            className="text-[11px] font-semibold text-danger hover:text-danger-600 transition-colors"
                        >
                            ✕ Dispute
                        </button>
                    )}
                    {hasResult && !canConfirm && !canDispute && onViewResult && (
                        <button
                            onClick={() => onViewResult(match.id)}
                            className="text-[11px] font-semibold text-foreground/50 hover:text-foreground/80 transition-colors"
                        >
                            View Result →
                        </button>
                    )}
                </div>

                {/* Dispute deadline */}
                {match.status === "SUBMITTED" && match.disputeDeadline && (
                    <p className="text-[10px] text-warning-600 dark:text-warning-400" suppressHydrationWarning>
                        ⏰ Auto-confirms {new Date(match.disputeDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                )}
            </CardBody>
        </Card>
    );
}

/* ─── Compact Match Slot (used inside the bracket tree) ──────── */

function CompactMatch({
    match,
    currentPlayerId,
    onViewResult,
}: {
    match: BracketMatchData;
    currentPlayerId?: string;
    onViewResult?: (matchId: string) => void;
}) {
    const isParticipant = currentPlayerId === match.player1Id || currentPlayerId === match.player2Id;
    const hasResult = match.status === "CONFIRMED" || match.status === "SUBMITTED";
    const statusColor =
        match.status === "CONFIRMED" ? "bg-success" :
            match.status === "SUBMITTED" ? "bg-warning" :
                match.status === "DISPUTED" ? "bg-danger" :
                    match.status === "BYE" ? "bg-secondary" :
                        "bg-foreground/20";

    const borderClass = isParticipant && match.status === "PENDING" && match.player1Id && match.player2Id
        ? "border-primary/60"
        : "border-divider";

    const renderRow = (
        player: BracketPlayer | null,
        score: number | null,
        isWinner: boolean,
        isCurrent: boolean,
        isTop: boolean,
    ) => (
        <div className={`flex items-center gap-1.5 px-2 py-1 ${isTop ? "rounded-t-lg" : "rounded-b-lg"} ${isWinner ? "bg-success/10" : ""
            }`}>
            <span className={`text-[11px] truncate flex-1 ${isCurrent ? "text-primary font-semibold" :
                isWinner ? "text-success font-medium" :
                    player ? "text-foreground/80" : "text-foreground/25 italic"
                }`}>
                {player?.displayName ?? "TBD"}
            </span>
            {score !== null && (
                <span className={`text-[11px] font-bold tabular-nums min-w-[14px] text-right ${isWinner ? "text-success" : "text-foreground/40"
                    }`}>{score}</span>
            )}
            {isWinner && <Trophy className="h-2.5 w-2.5 text-success shrink-0" />}
        </div>
    );

    return (
        <div className={`border rounded-lg w-[170px] transition-all relative ${borderClass} flex items-center`}>
            <div className="flex-1 min-w-0">
                {renderRow(match.player1, match.score1, match.winnerId === match.player1Id && match.winnerId !== null, currentPlayerId === match.player1Id, true)}
                <div className="h-px bg-divider" />
                {renderRow(match.player2, match.score2, match.winnerId === match.player2Id && match.winnerId !== null, currentPlayerId === match.player2Id, false)}
            </div>
            {/* Eye icon for completed matches */}
            {hasResult ? (
                <button
                    className="p-1 mr-1 rounded hover:bg-foreground/10 transition-colors shrink-0"
                    onClick={() => onViewResult?.(match.id)}
                >
                    <Eye className="h-3.5 w-3.5 text-foreground/30" />
                </button>
            ) : (
                <div className={`absolute -right-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${statusColor}`} />
            )}
        </div>
    );
}

/* ─── Bracket View (proper bracket tree) ─────────────────────── */

export function BracketView({
    rounds,
    totalRounds,
    currentPlayerId,
    onSubmitResult,
    onConfirmResult,
    onDispute,
    onViewResult,
}: BracketViewProps) {
    if (rounds.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Trophy className="h-10 w-10 text-foreground/20" />
                <p className="text-foreground/50 text-sm">Bracket not generated yet</p>
            </div>
        );
    }

    const MATCH_H = 48;
    const GAP = 8;

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex items-start min-w-max">
                {rounds.map((round, ri) => {
                    const mult = Math.pow(2, ri);
                    const gap = ri === 0 ? GAP : (MATCH_H + GAP) * mult - MATCH_H;
                    const padTop = ri === 0 ? 0 : ((MATCH_H + GAP) * mult - MATCH_H - GAP) / 2;

                    return (
                        <div key={round.round} className="flex items-start">
                            <div style={{ paddingTop: padTop }}>
                                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider text-center mb-2">
                                    {round.name}
                                </p>
                                <div className="flex flex-col" style={{ gap }}>
                                    {round.matches.map((m) => (
                                        <CompactMatch key={m.id} match={m} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                                    ))}
                                </div>
                            </div>

                            {ri < rounds.length - 1 && (
                                <div style={{ paddingTop: padTop }}>
                                    <p className="text-[10px] opacity-0 mb-2">.</p>
                                    <div className="flex flex-col" style={{ gap }}>
                                        {Array.from({ length: Math.ceil(round.matches.length / 2) }).map((_, pi) => {
                                            const pair = round.matches.slice(pi * 2, pi * 2 + 2);
                                            const done = pair.every(m => m.status === "CONFIRMED" || m.status === "BYE");
                                            const lc = done ? "border-success/30" : "border-foreground/10";
                                            const h = pair.length === 2 ? MATCH_H * 2 + gap : MATCH_H;

                                            return (
                                                <div key={pi} className="relative" style={{ height: h, width: 24 }}>
                                                    {pair.length === 2 ? (
                                                        <>
                                                            <div className={`absolute left-0 top-[${MATCH_H / 2}px] border-t ${lc}`} style={{ width: 8, top: MATCH_H / 2 }} />
                                                            <div className={`absolute left-0 border-t ${lc}`} style={{ width: 8, top: MATCH_H + gap + MATCH_H / 2 }} />
                                                            <div className={`absolute left-[8px] border-r ${lc}`} style={{ top: MATCH_H / 2, bottom: h - MATCH_H - gap - MATCH_H / 2 }} />
                                                            <div className={`absolute left-[8px] right-0 border-t ${lc}`} style={{ top: h / 2 }} />
                                                        </>
                                                    ) : (
                                                        <div className={`absolute left-0 right-0 border-t ${lc}`} style={{ top: MATCH_H / 2 }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {rounds.length > 0 && (() => {
                    const winner = rounds[rounds.length - 1]?.matches[0]?.winner;
                    return (
                        <div className="flex flex-col items-center justify-center min-w-[80px] gap-1 self-center ml-2">
                            <Trophy className={`h-7 w-7 ${winner ? "text-warning-500" : "text-foreground/15"}`} />
                            {winner ? (
                                <>
                                    <p className="text-xs font-bold text-warning-500">🏆</p>
                                    <p className="text-[11px] font-semibold text-center">{winner.displayName}</p>
                                </>
                            ) : (
                                <p className="text-[10px] text-foreground/25">TBD</p>
                            )}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}


/* ─── My Match Highlight ────────────────────────────────────── */

export function MyBracketMatch({
    rounds,
    currentPlayerId,
    onSubmitResult,
    onConfirmResult,
    onDispute,
}: {
    rounds: RoundData[];
    currentPlayerId: string;
    onSubmitResult?: (matchId: string) => void;
    onConfirmResult?: (matchId: string) => void;
    onDispute?: (matchId: string) => void;
}) {
    // Find the current player's active match
    const myMatch = rounds
        .flatMap((r) => r.matches)
        .find(
            (m) =>
                (m.player1Id === currentPlayerId || m.player2Id === currentPlayerId) &&
                (m.status === "PENDING" || m.status === "SUBMITTED" || m.status === "DISPUTED")
        );

    if (!myMatch) return null;

    const round = rounds.find((r) => r.matches.some((m) => m.id === myMatch.id));

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
        >
            <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase">
                    Your Match — {round?.name}
                </span>
            </div>
            <MatchCard
                match={myMatch}
                currentPlayerId={currentPlayerId}
                onSubmitResult={onSubmitResult}
                onConfirmResult={onConfirmResult}
                onDispute={onDispute}
            />
        </motion.div>
    );
}
