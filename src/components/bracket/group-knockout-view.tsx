"use client";

import { useState } from "react";
import { Avatar, Chip } from "@heroui/react";
import { ChevronDown, ChevronUp, Trophy, Clock, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─────────────────────────────────────────────────── */

interface BracketPlayer {
    id: string;
    displayName: string | null;
}

interface BracketMatchData {
    id: string;
    round: number;       // negative = group stage (-1=GroupA, -2=GroupB…), positive = knockout
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
    results: { screenshotUrl: string | null }[];
}

interface RoundData {
    round: number;
    name: string;
    matches: BracketMatchData[];
}

interface GroupKnockoutViewProps {
    rounds: RoundData[];
    totalRounds: number;
    currentPlayerId?: string;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}

/* ─── Helpers ────────────────────────────────────────────────── */

interface Standing {
    playerId: string;
    displayName: string | null;
    avatar: string | null;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
}

function computeGroupStandings(matches: BracketMatchData[]): Standing[] {
    const map = new Map<string, Standing>();

    const getOrCreate = (m: BracketMatchData, isP1: boolean): Standing => {
        const id = isP1 ? m.player1Id! : m.player2Id!;
        if (!map.has(id)) {
            map.set(id, {
                playerId: id,
                displayName: isP1 ? m.player1?.displayName ?? null : m.player2?.displayName ?? null,
                avatar: isP1 ? m.player1Avatar : m.player2Avatar,
                played: 0, wins: 0, draws: 0, losses: 0,
                goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
            });
        }
        return map.get(id)!;
    };

    for (const m of matches) {
        if (!m.player1Id || !m.player2Id) continue;
        const p1 = getOrCreate(m, true);
        const p2 = getOrCreate(m, false);
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;

        if (m.status === "CONFIRMED") {
            p1.played++; p2.played++;
            p1.goalsFor += s1; p1.goalsAgainst += s2;
            p2.goalsFor += s2; p2.goalsAgainst += s1;
            p1.goalDiff = p1.goalsFor - p1.goalsAgainst;
            p2.goalDiff = p2.goalsFor - p2.goalsAgainst;

            if (m.winnerId === m.player1Id) {
                p1.wins++; p1.points += 3; p2.losses++;
            } else if (m.winnerId === m.player2Id) {
                p2.wins++; p2.points += 3; p1.losses++;
            } else {
                p1.draws++; p1.points += 1;
                p2.draws++; p2.points += 1;
            }
        } else {
            // Not confirmed yet — just ensure player row exists with 0 stats
            getOrCreate(m, true);
            getOrCreate(m, false);
        }
    }

    return Array.from(map.values()).sort(
        (a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor
    );
}

/* ─── Group Section (collapsible) ───────────────────────────── */

function GroupSection({
    groupLetter,
    matches,
    currentPlayerId,
    onSubmitResult,
    onConfirmResult,
    onDispute,
    onViewResult,
}: {
    groupLetter: string;
    matches: BracketMatchData[];
    currentPlayerId?: string;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}) {
    const [open, setOpen] = useState(groupLetter === "A"); // First group expanded by default
    const standings = computeGroupStandings(matches);
    const confirmedCount = matches.filter(m => m.status === "CONFIRMED").length;
    const totalMatches = matches.filter(m => m.player1Id && m.player2Id).length;

    return (
        <div className="rounded-2xl overflow-hidden border border-divider">
            {/* Header */}
            <button
                className="w-full flex items-center justify-between px-4 py-3 bg-primary/10 hover:bg-primary/15 transition-colors"
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">Group {groupLetter}</span>
                    <Chip size="sm" variant="flat" color={confirmedCount === totalMatches && totalMatches > 0 ? "success" : "default"} className="text-[10px] h-5">
                        {confirmedCount}/{totalMatches} done
                    </Chip>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-foreground/50" /> : <ChevronDown className="h-4 w-4 text-foreground/50" />}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                        {/* Standings Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-divider bg-default-50/50">
                                        <th className="text-left px-3 py-2 text-foreground/50 font-medium w-6">#</th>
                                        <th className="text-left px-2 py-2 text-foreground/50 font-medium">Player</th>
                                        <th className="text-center px-2 py-2 text-foreground/50 font-medium">P</th>
                                        <th className="text-center px-2 py-2 text-foreground/50 font-medium">W</th>
                                        <th className="text-center px-2 py-2 text-foreground/50 font-medium">D</th>
                                        <th className="text-center px-2 py-2 text-foreground/50 font-medium">L</th>
                                        <th className="text-center px-2 py-2 text-foreground/50 font-medium">GF</th>
                                        <th className="text-center px-2 py-2 text-foreground/50 font-medium">GA</th>
                                        <th className="text-center px-2 py-2 text-foreground/50 font-medium">GD</th>
                                        <th className="text-center px-2 py-2 text-foreground/60 font-bold">Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((s, i) => {
                                        const isMe = s.playerId === currentPlayerId;
                                        const advances = i < 2; // Top 2 advance
                                        return (
                                            <tr
                                                key={s.playerId}
                                                className={`border-b border-divider/50 ${isMe ? "bg-primary/5" : i % 2 === 0 ? "bg-background" : "bg-default-50/30"}`}
                                            >
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`font-bold ${advances ? "text-success-600" : "text-foreground/30"}`}>{i + 1}</span>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar
                                                            src={s.avatar || undefined}
                                                            name={s.displayName?.[0] || "?"}
                                                            size="sm"
                                                            className="h-5 w-5 text-[10px] shrink-0"
                                                        />
                                                        <span className={`truncate font-medium ${isMe ? "text-primary" : ""}`}>
                                                            {s.displayName ?? "Unknown"}
                                                            {isMe && <span className="text-[9px] text-primary ml-1">(You)</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center tabular-nums text-foreground/60">{s.played}</td>
                                                <td className="px-2 py-2 text-center tabular-nums text-success-600">{s.wins}</td>
                                                <td className="px-2 py-2 text-center tabular-nums text-foreground/40">{s.draws}</td>
                                                <td className="px-2 py-2 text-center tabular-nums text-danger-500">{s.losses}</td>
                                                <td className="px-2 py-2 text-center tabular-nums text-foreground/60">{s.goalsFor}</td>
                                                <td className="px-2 py-2 text-center tabular-nums text-foreground/60">{s.goalsAgainst}</td>
                                                <td className={`px-2 py-2 text-center tabular-nums font-medium ${s.goalDiff > 0 ? "text-success-600" : s.goalDiff < 0 ? "text-danger-500" : "text-foreground/40"}`}>
                                                    {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                                                </td>
                                                <td className="px-2 py-2 text-center tabular-nums font-bold text-foreground">{s.points}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Matches in this group */}
                        <div className="p-3 space-y-2 border-t border-divider">
                            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Matches</p>
                            {matches.filter(m => m.player1Id && m.player2Id).map(m => (
                                <GroupMatchRow
                                    key={m.id}
                                    match={m}
                                    currentPlayerId={currentPlayerId}
                                    onSubmitResult={onSubmitResult}
                                    onConfirmResult={onConfirmResult}
                                    onDispute={onDispute}
                                    onViewResult={onViewResult}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Group Match Row ────────────────────────────────────────── */

function GroupMatchRow({
    match,
    currentPlayerId,
    onSubmitResult,
    onConfirmResult,
    onDispute,
    onViewResult,
}: {
    match: BracketMatchData;
    currentPlayerId?: string;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}) {
    const isP1 = currentPlayerId === match.player1Id;
    const isP2 = currentPlayerId === match.player2Id;
    const isParticipant = isP1 || isP2;
    const canSubmit = isParticipant && match.status === "PENDING" && match.player1Id && match.player2Id;
    const canConfirm = isParticipant && match.status === "SUBMITTED" && match.winnerId !== currentPlayerId;
    const canDispute = isParticipant && match.status === "SUBMITTED" && match.winnerId !== currentPlayerId;
    const hasResult = match.status === "CONFIRMED" || match.status === "SUBMITTED";

    const statusColor =
        match.status === "CONFIRMED" ? "text-success-600" :
            match.status === "SUBMITTED" ? "text-warning-600" :
                match.status === "DISPUTED" ? "text-danger-600" :
                    "text-foreground/40";

    const statusIcon =
        match.status === "CONFIRMED" ? <CheckCircle2 className="h-3 w-3" /> :
            match.status === "SUBMITTED" ? <Clock className="h-3 w-3" /> :
                match.status === "DISPUTED" ? <AlertTriangle className="h-3 w-3" /> :
                    <Clock className="h-3 w-3 opacity-30" />;

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${isParticipant && match.status === "PENDING" ? "border-primary/40 bg-primary/5" : "border-divider bg-default-50/30"}`}>
            {/* Player 1 */}
            <span className={`flex-1 truncate font-medium text-right ${isP1 ? "text-primary" : match.winnerId === match.player1Id ? "text-success-600" : ""}`}>
                {match.player1?.displayName ?? "TBD"}
            </span>

            {/* Score or VS */}
            <div className="flex items-center gap-1 shrink-0">
                {match.score1 !== null ? (
                    <>
                        <span className={`font-bold tabular-nums ${match.winnerId === match.player1Id ? "text-success-600" : "text-foreground/60"}`}>{match.score1}</span>
                        <span className="text-foreground/30">-</span>
                        <span className={`font-bold tabular-nums ${match.winnerId === match.player2Id ? "text-success-600" : "text-foreground/60"}`}>{match.score2}</span>
                    </>
                ) : (
                    <span className="text-foreground/30 text-[10px]">vs</span>
                )}
            </div>

            {/* Player 2 */}
            <span className={`flex-1 truncate font-medium ${isP2 ? "text-primary" : match.winnerId === match.player2Id ? "text-success-600" : ""}`}>
                {match.player2?.displayName ?? "TBD"}
            </span>

            {/* Status + action */}
            <div className={`flex items-center gap-1 shrink-0 ${statusColor}`}>
                {statusIcon}
                {canSubmit && onSubmitResult && (
                    <button onClick={() => onSubmitResult(match.id)} className="text-[10px] font-bold text-primary underline">
                        Submit
                    </button>
                )}
                {canConfirm && onConfirmResult && (
                    <button onClick={() => onConfirmResult(match.id)} className="text-[10px] font-bold text-success underline">
                        Confirm
                    </button>
                )}
                {canDispute && onDispute && (
                    <button onClick={() => onDispute(match.id)} className="text-[10px] font-bold text-danger underline ml-1">
                        Dispute
                    </button>
                )}
                {hasResult && !canConfirm && !canDispute && onViewResult && (
                    <button onClick={() => onViewResult(match.id)} className="ml-1">
                        <Eye className="h-3 w-3 text-foreground/30 hover:text-foreground/60" />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─── Compact Knockout Match (for the bracket tree) ─────────── */

function KOMatch({
    match,
    currentPlayerId,
    onViewResult,
}: {
    match: BracketMatchData;
    currentPlayerId?: string;
    onViewResult?: (id: string) => void;
}) {
    const isParticipant = currentPlayerId === match.player1Id || currentPlayerId === match.player2Id;
    const hasResult = match.status === "CONFIRMED" || match.status === "SUBMITTED";

    const row = (
        player: BracketPlayer | null,
        score: number | null,
        isWinner: boolean,
        isCurrent: boolean,
        isTop: boolean,
    ) => (
        <div className={`flex items-center gap-1.5 px-2 py-1 ${isTop ? "rounded-t-lg" : "rounded-b-lg"} ${isWinner ? "bg-success/10" : ""}`}>
            <span className={`text-[11px] truncate flex-1 ${isCurrent ? "text-primary font-semibold" : isWinner ? "text-success font-medium" : player ? "text-foreground/80" : "text-foreground/25 italic"}`}>
                {player?.displayName ?? "TBD"}
            </span>
            {score !== null && (
                <span className={`text-[11px] font-bold tabular-nums ${isWinner ? "text-success" : "text-foreground/40"}`}>{score}</span>
            )}
            {isWinner && <Trophy className="h-2.5 w-2.5 text-success shrink-0" />}
        </div>
    );

    return (
        <div className={`border rounded-lg w-[160px] transition-all relative flex items-center ${isParticipant && match.status === "PENDING" && match.player1Id && match.player2Id ? "border-primary/60" : "border-divider"}`}>
            <div className="flex-1 min-w-0">
                {row(match.player1, match.score1, match.winnerId === match.player1Id && !!match.winnerId, currentPlayerId === match.player1Id, true)}
                <div className="h-px bg-divider" />
                {row(match.player2, match.score2, match.winnerId === match.player2Id && !!match.winnerId, currentPlayerId === match.player2Id, false)}
            </div>
            {hasResult && onViewResult && (
                <button className="p-1 mr-1 rounded hover:bg-foreground/10 transition-colors shrink-0" onClick={() => onViewResult(match.id)}>
                    <Eye className="h-3.5 w-3.5 text-foreground/30" />
                </button>
            )}
        </div>
    );
}

/* ─── Group + Knockout View ─────────────────────────────────── */

export function GroupKnockoutView({
    rounds,
    totalRounds,
    currentPlayerId,
    onSubmitResult,
    onConfirmResult,
    onDispute,
    onViewResult,
}: GroupKnockoutViewProps) {
    // Split rounds: negative = group stage, positive = knockout
    const groupRounds = rounds.filter(r => r.round < 0).sort((a, b) => a.round - b.round); // -1, -2, ... (Group A, B, ...)
    const koRounds = rounds.filter(r => r.round > 0).sort((a, b) => a.round - b.round);

    const MATCH_H = 48;
    const GAP = 8;

    const koRoundNames = (round: number) => {
        const maxRound = Math.max(...koRounds.map(r => r.round));
        if (round === maxRound) return "Final";
        if (round === maxRound - 1) return "Semi-Final";
        if (round === maxRound - 2) return "Quarter-Final";
        return `Round ${round}`;
    };

    return (
        <div className="space-y-6">
            {/* ── Group Stage ── */}
            {groupRounds.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
                        <span>🌍</span> Group Stage
                    </h3>
                    {groupRounds.map((r) => {
                        const groupIndex = -r.round - 1; // -1 → 0 (A), -2 → 1 (B), etc.
                        const letter = String.fromCharCode(65 + groupIndex);
                        return (
                            <GroupSection
                                key={r.round}
                                groupLetter={letter}
                                matches={r.matches}
                                currentPlayerId={currentPlayerId}
                                onSubmitResult={onSubmitResult}
                                onConfirmResult={onConfirmResult}
                                onDispute={onDispute}
                                onViewResult={onViewResult}
                            />
                        );
                    })}
                </div>
            )}

            {/* ── Knockout Stage ── */}
            {koRounds.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
                        <span>⚔️</span> Knockout Stage
                    </h3>
                    <div className="overflow-x-auto pb-4">
                        <div className="flex items-start min-w-max gap-0">
                            {koRounds.map((round, ri) => {
                                const mult = Math.pow(2, ri);
                                const gap = ri === 0 ? GAP : (MATCH_H + GAP) * mult - MATCH_H;
                                const padTop = ri === 0 ? 0 : ((MATCH_H + GAP) * mult - MATCH_H - GAP) / 2;
                                const mainMatches = round.matches.filter(m => m.position === 0 || ri < koRounds.length - 1 || m.position !== 1);

                                return (
                                    <div key={round.round} className="flex items-start">
                                        <div style={{ paddingTop: padTop }}>
                                            <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider text-center mb-2">
                                                {koRoundNames(round.round)}
                                            </p>
                                            <div className="flex flex-col" style={{ gap }}>
                                                {mainMatches.map(m => (
                                                    <KOMatch
                                                        key={m.id}
                                                        match={m}
                                                        currentPlayerId={currentPlayerId}
                                                        onViewResult={onViewResult}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Connector lines */}
                                        {ri < koRounds.length - 1 && (
                                            <div style={{ paddingTop: padTop }}>
                                                <p className="text-[10px] opacity-0 mb-2">.</p>
                                                <div className="flex flex-col" style={{ gap }}>
                                                    {Array.from({ length: Math.ceil(mainMatches.length / 2) }).map((_, pi) => {
                                                        const pair = mainMatches.slice(pi * 2, pi * 2 + 2);
                                                        const done = pair.every(m => m.status === "CONFIRMED" || m.status === "BYE");
                                                        const lc = done ? "border-success/30" : "border-foreground/10";
                                                        const h = pair.length === 2 ? MATCH_H * 2 + gap : MATCH_H;
                                                        return (
                                                            <div key={pi} className="relative" style={{ height: h, width: 24 }}>
                                                                {pair.length === 2 ? (
                                                                    <>
                                                                        <div className={`absolute left-0 border-t ${lc}`} style={{ width: 8, top: MATCH_H / 2 }} />
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

                            {/* Trophy / Winner */}
                            {koRounds.length > 0 && (() => {
                                const lastRound = koRounds[koRounds.length - 1];
                                const finalMatch = lastRound?.matches.find(m => m.position === 0);
                                const winner = finalMatch?.winnerId
                                    ? (finalMatch.player1Id === finalMatch.winnerId ? finalMatch.player1 : finalMatch.player2)
                                    : null;
                                return (
                                    <div className="flex flex-col items-center justify-center min-w-[80px] gap-1 self-center ml-2">
                                        <Trophy className={`h-7 w-7 ${winner ? "text-warning-500" : "text-foreground/15"}`} />
                                        {winner ? (
                                            <p className="text-[11px] font-bold text-warning-500 text-center">{winner.displayName}</p>
                                        ) : (
                                            <p className="text-[10px] text-foreground/25">TBD</p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* 3rd Place */}
                    {koRounds.length > 0 && (() => {
                        const lastRound = koRounds[koRounds.length - 1];
                        const thirdMatch = lastRound?.matches.find(m => m.position === 1);
                        if (!thirdMatch) return null;
                        return (
                            <div className="max-w-xs">
                                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-2">🥉 3rd Place</p>
                                <KOMatch match={thirdMatch} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
