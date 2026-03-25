"use client";

import { useState } from "react";
import { Chip } from "@heroui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@heroui/react";
import { BracketMatchData, RoundData, MatchRow } from "./bracket-shared";
import { KOBracket } from "./bracket-view";

interface GroupKnockoutViewProps {
    rounds: RoundData[];
    totalRounds: number;
    currentPlayerId?: string;
    isAdmin?: boolean;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}

/* ─── Standings ─────────────────────────────────────────────── */

interface Standing {
    playerId: string; displayName: string | null; avatar: string | null;
    played: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; goalDiff: number; points: number;
}

function computeGroupStandings(matches: BracketMatchData[]): Standing[] {
    const map = new Map<string, Standing>();
    const get = (m: BracketMatchData, isP1: boolean) => {
        const id = isP1 ? m.player1Id! : m.player2Id!;
        if (!map.has(id)) map.set(id, {
            playerId: id,
            displayName: isP1 ? m.player1?.displayName ?? null : m.player2?.displayName ?? null,
            avatar: isP1 ? m.player1Avatar : m.player2Avatar,
            played: 0, wins: 0, draws: 0, losses: 0,
            goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
        });
        return map.get(id)!;
    };
    for (const m of matches) {
        if (!m.player1Id || !m.player2Id) continue;
        get(m, true); get(m, false);
        const p1 = map.get(m.player1Id)!;
        const p2 = map.get(m.player2Id)!;
        const s1 = m.score1 ?? 0; const s2 = m.score2 ?? 0;
        if (m.status === "CONFIRMED") {
            p1.played++; p2.played++;
            p1.goalsFor += s1; p1.goalsAgainst += s2;
            p2.goalsFor += s2; p2.goalsAgainst += s1;
            p1.goalDiff = p1.goalsFor - p1.goalsAgainst;
            p2.goalDiff = p2.goalsFor - p2.goalsAgainst;
            if (m.winnerId === m.player1Id) { p1.wins++; p1.points += 3; p2.losses++; }
            else if (m.winnerId === m.player2Id) { p2.wins++; p2.points += 3; p1.losses++; }
            else { p1.draws++; p1.points += 1; p2.draws++; p2.points += 1; }
        }
    }
    return Array.from(map.values()).sort(
        (a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor
    );
}

/* ─── Group Section ─────────────────────────────────────────── */

function GroupSection({ groupLetter, matches, isDefaultOpen, currentPlayerId, isAdmin, onSubmitResult, onConfirmResult, onDispute, onViewResult }: {
    groupLetter: string; matches: BracketMatchData[]; isDefaultOpen: boolean;
    currentPlayerId?: string; isAdmin?: boolean;
    onSubmitResult?: (id: string) => void; onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void; onViewResult?: (id: string) => void;
}) {
    const [open, setOpen] = useState(isDefaultOpen);
    const standings = computeGroupStandings(matches);
    const confirmedCount = matches.filter(m => m.status === "CONFIRMED").length;
    const totalMatches = matches.filter(m => m.player1Id && m.player2Id).length;
    const allDone = confirmedCount === totalMatches && totalMatches > 0;
    const hasDispute = matches.some(m => m.status === "DISPUTED");
    const hasPending = matches.some(m => m.status === "PENDING" && m.player1Id && m.player2Id);
    const hasSubmitted = matches.some(m => m.status === "SUBMITTED");

    return (
        <div className="rounded-2xl overflow-hidden border border-divider">
            <button
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${allDone ? "bg-success/10 hover:bg-success/15" : "bg-primary/8 hover:bg-primary/12"}`}
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${allDone ? "text-success-600" : "text-primary"}`}>Group {groupLetter}</span>
                    <Chip size="sm" variant="flat" color={allDone ? "success" : "default"} className="text-[10px] h-5">
                        {confirmedCount}/{totalMatches} done
                    </Chip>
                    {hasDispute && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-danger/15 border border-danger/30">
                            <div className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                            <span className="text-[10px] font-bold text-danger-500">Dispute</span>
                        </div>
                    )}
                    {hasSubmitted && !hasDispute && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-warning/15 border border-warning/30">
                            <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                            <span className="text-[10px] font-bold text-warning-500">To confirm</span>
                        </div>
                    )}
                    {hasPending && !hasSubmitted && !hasDispute && !allDone && (
                        <div className="h-2 w-2 rounded-full bg-warning animate-pulse" title="Matches pending" />
                    )}
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-foreground/50" /> : <ChevronDown className="h-4 w-4 text-foreground/50" />}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div key="content"
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }}>
                        {/* Standings table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-divider bg-default-50/50">
                                        <th className="text-left px-3 py-2 text-foreground/50 font-medium w-6">#</th>
                                        <th className="text-left px-2 py-2 text-foreground/50 font-medium">Player</th>
                                        {["P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map(h => (
                                            <th key={h} className={`text-center px-2 py-2 font-medium ${h === "Pts" ? "text-foreground/60 font-bold" : "text-foreground/50"}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {standings.map((s, i) => {
                                        const isMe = s.playerId === currentPlayerId;
                                        const advances = i < 2;
                                        return (
                                            <tr key={s.playerId} className={`border-b border-divider/50 ${isMe ? "bg-primary/5" : i % 2 === 0 ? "bg-background" : "bg-default-50/30"}`}>
                                                <td className="px-3 py-2 text-center">
                                                    <span className={`font-bold text-xs ${advances ? "text-success-600" : "text-foreground/30"}`}>{i + 1}</span>
                                                </td>
                                                <td className="px-2 py-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar src={s.avatar || undefined} name={s.displayName?.[0] || "?"} size="sm" className="h-5 w-5 text-[10px] shrink-0" />
                                                        <span className={`truncate text-xs font-medium ${isMe ? "text-primary" : ""}`}>
                                                            {s.displayName ?? "Unknown"}
                                                            {isMe && <span className="text-[9px] text-primary ml-1">(You)</span>}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-center tabular-nums text-foreground/60">{s.played}</td>
                                                <td className="px-2 py-2 text-center tabular-nums text-success-600 font-medium">{s.wins}</td>
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
                        {/* Match list */}
                        <div className="p-3 space-y-1.5 border-t border-divider">
                            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Matches</p>
                            {matches.filter(m => m.player1Id && m.player2Id).map(m => (
                                <MatchRow key={m.id} match={m} currentPlayerId={currentPlayerId} isAdmin={isAdmin}
                                    onSubmitResult={onSubmitResult} onConfirmResult={onConfirmResult}
                                    onDispute={onDispute} onViewResult={onViewResult} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── GroupKnockoutView ─────────────────────────────────────── */

export function GroupKnockoutView({ rounds, totalRounds, currentPlayerId, isAdmin, onSubmitResult, onConfirmResult, onDispute, onViewResult }: GroupKnockoutViewProps) {
    const groupRounds = rounds.filter(r => r.round < 0).sort((a, b) => b.round - a.round);
    const koRounds = rounds.filter(r => r.round > 0).sort((a, b) => a.round - b.round);

    // Has KO stage started? (any KO match with players assigned)
    const koStarted = koRounds.some(r => r.matches.some(m => m.player1Id && m.player2Id));

    const koRoundName = (round: number) => {
        const max = Math.max(...koRounds.map(r => r.round));
        if (round === max) return "Final";
        if (round === max - 1) return "Semi-Final";
        if (round === max - 2) return "Quarter-Final";
        return `Round ${round}`;
    };

    // Rename KO rounds for display; KOBracket handles the tree & connectors
    const koRoundsForBracket: RoundData[] = koRounds.map(r => ({ ...r, name: koRoundName(r.round) }));

    return (
        <div className="space-y-6">
            {/* Group Stage */}
            {groupRounds.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                        🌍 Group Stage
                    </h3>
                    {groupRounds.map(r => {
                        const letter = String.fromCharCode(65 + (-r.round - 1));
                        const userInGroup = r.matches.some(m => m.player1Id === currentPlayerId || m.player2Id === currentPlayerId);
                        // Auto-collapse groups once KO stage has started (unless user is in the group)
                        const shouldAutoOpen = koStarted ? false : userInGroup;
                        return (
                            <GroupSection key={r.round} groupLetter={letter} matches={r.matches}
                                isDefaultOpen={shouldAutoOpen} currentPlayerId={currentPlayerId} isAdmin={isAdmin}
                                onSubmitResult={onSubmitResult} onConfirmResult={onConfirmResult}
                                onDispute={onDispute} onViewResult={onViewResult} />
                        );
                    })}
                </div>
            )}

            {/* Knockout Stage — reuses same KOBracket as BRACKET_1V1 */}
            {koRounds.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                        ⚔️ Knockout Stage
                    </h3>
                    <KOBracket rounds={koRoundsForBracket} currentPlayerId={currentPlayerId} isAdmin={isAdmin} onViewResult={onViewResult} />
                </div>
            )}
        </div>
    );
}
