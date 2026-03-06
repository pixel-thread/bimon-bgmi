"use client";

import { Avatar, Card, CardBody, Chip, Spinner } from "@heroui/react";
import { Trophy, Clock, AlertTriangle, CheckCircle2, Minus } from "lucide-react";
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

/* ─── Bracket Connector Lines ───────────────────────────────── */

function BracketConnector({ matchCount }: { matchCount: number }) {
    // SVG connectors: pairs of matches connect to one next-round match
    const pairs = Math.floor(matchCount / 2);
    if (pairs === 0) return null;

    return (
        <div className="flex flex-col justify-around flex-1 min-w-[32px]">
            {Array.from({ length: pairs }).map((_, i) => (
                <div key={i} className="flex items-center h-full">
                    <svg width="32" height="100%" viewBox="0 0 32 100" preserveAspectRatio="none" className="h-full">
                        {/* Top line going right */}
                        <line x1="0" y1="25" x2="16" y2="25" stroke="currentColor" strokeWidth="1" className="text-foreground/15" />
                        {/* Bottom line going right */}
                        <line x1="0" y1="75" x2="16" y2="75" stroke="currentColor" strokeWidth="1" className="text-foreground/15" />
                        {/* Vertical connector */}
                        <line x1="16" y1="25" x2="16" y2="75" stroke="currentColor" strokeWidth="1" className="text-foreground/15" />
                        {/* Middle line going right to next match */}
                        <line x1="16" y1="50" x2="32" y2="50" stroke="currentColor" strokeWidth="1" className="text-foreground/15" />
                    </svg>
                </div>
            ))}
        </div>
    );
}

/* ─── Bracket View (Horizontal Scrollable with connectors) ─── */

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

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex items-stretch min-w-max">
                {rounds.map((round, idx) => {
                    // Increasing spacing between matches for each round
                    const gapClass = idx === 0 ? "gap-3" : idx === 1 ? "gap-8" : idx === 2 ? "gap-16" : "gap-24";

                    return (
                        <div key={round.round} className="flex items-stretch">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex flex-col min-w-[210px]"
                            >
                                {/* Round header */}
                                <div className="text-center mb-3">
                                    <h3 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                                        {round.name}
                                    </h3>
                                    <p className="text-[10px] text-foreground/40">
                                        {round.matches.length} match{round.matches.length !== 1 ? "es" : ""}
                                    </p>
                                </div>

                                {/* Matches in this round */}
                                <div className={`flex flex-col ${gapClass} justify-around flex-1`}>
                                    {round.matches.map((match) => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                            currentPlayerId={currentPlayerId}
                                            onSubmitResult={onSubmitResult}
                                            onConfirmResult={onConfirmResult}
                                            onDispute={onDispute}
                                            onViewResult={onViewResult}
                                        />
                                    ))}
                                </div>
                            </motion.div>

                            {/* Connector lines between this round and next */}
                            {idx < rounds.length - 1 && (
                                <BracketConnector matchCount={round.matches.length} />
                            )}
                        </div>
                    );
                })}

                {/* Winner column */}
                {rounds.length > 0 && (() => {
                    const final = rounds[rounds.length - 1]?.matches[0];
                    const winner = final?.winner;
                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: rounds.length * 0.1 }}
                            className="flex flex-col items-center justify-center min-w-[120px] gap-2"
                        >
                            <Trophy className={`h-8 w-8 ${winner ? "text-warning-500" : "text-foreground/20"}`} />
                            {winner ? (
                                <>
                                    <p className="text-sm font-bold text-warning-600 dark:text-warning-400">
                                        🏆 Champion
                                    </p>
                                    <p className="text-xs font-medium">
                                        {winner.displayName}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-foreground/30">TBD</p>
                            )}
                        </motion.div>
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
