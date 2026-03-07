"use client";

import { useState } from "react";
import { Chip } from "@heroui/react";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@heroui/react";
import {
    BracketMatchData, RoundData,
    CompactMatch, MatchRow,
    usePinchZoom, ZoomControls,
} from "./bracket-shared";

interface GroupKnockoutViewProps {
    rounds: RoundData[];
    totalRounds: number;
    currentPlayerId?: string;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}

/* ─── Standings Computation ─────────────────────────────────── */

interface Standing {
    playerId: string;
    displayName: string | null;
    avatar: string | null;
    played: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; goalDiff: number; points: number;
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
        getOrCreate(m, true);
        getOrCreate(m, false);
        const p1 = map.get(m.player1Id)!;
        const p2 = map.get(m.player2Id)!;
        const s1 = m.score1 ?? 0;
        const s2 = m.score2 ?? 0;

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

/* ─── Group Section (collapsible) ───────────────────────────── */

function GroupSection({
    groupLetter, matches, isDefaultOpen, currentPlayerId,
    onSubmitResult, onConfirmResult, onDispute, onViewResult,
}: {
    groupLetter: string;
    matches: BracketMatchData[];
    isDefaultOpen: boolean;
    currentPlayerId?: string;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}) {
    const [open, setOpen] = useState(isDefaultOpen);
    const standings = computeGroupStandings(matches);
    const confirmedCount = matches.filter(m => m.status === "CONFIRMED").length;
    const totalMatches = matches.filter(m => m.player1Id && m.player2Id).length;
    const allDone = confirmedCount === totalMatches && totalMatches > 0;

    return (
        <div className="rounded-2xl overflow-hidden border border-divider">
            {/* Header */}
            <button
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${allDone ? "bg-success/10 hover:bg-success/15" : "bg-primary/8 hover:bg-primary/12"}`}
                onClick={() => setOpen(v => !v)}
            >
                <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${allDone ? "text-success-600" : "text-primary"}`}>Group {groupLetter}</span>
                    <Chip size="sm" variant="flat" color={allDone ? "success" : "default"} className="text-[10px] h-5">
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

                        {/* Matches */}
                        <div className="p-3 space-y-1.5 border-t border-divider">
                            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-2">Matches</p>
                            {matches.filter(m => m.player1Id && m.player2Id).map(m => (
                                <MatchRow
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

/* ─── Group + Knockout View ─────────────────────────────────── */

export function GroupKnockoutView({
    rounds, totalRounds, currentPlayerId,
    onSubmitResult, onConfirmResult, onDispute, onViewResult,
}: GroupKnockoutViewProps) {
    // Group A (-1) first, then B (-2), etc.  Sort descending by round (least negative first)
    const groupRounds = rounds.filter(r => r.round < 0).sort((a, b) => b.round - a.round);
    const koRounds = rounds.filter(r => r.round > 0).sort((a, b) => a.round - b.round);

    const MATCH_H = 48;
    const GAP = 8;

    const koRoundName = (round: number) => {
        const maxRound = Math.max(...koRounds.map(r => r.round));
        if (round === maxRound) return "Final";
        if (round === maxRound - 1) return "Semi-Final";
        if (round === maxRound - 2) return "Quarter-Final";
        return `Round ${round}`;
    };

    const { zoom, zoomIn, zoomOut, reset, containerRef } = usePinchZoom();

    return (
        <div className="space-y-6">
            {/* ── Group Stage ── */}
            {groupRounds.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                        🌍 Group Stage
                    </h3>
                    {groupRounds.map(r => {
                        const groupIndex = -r.round - 1;
                        const letter = String.fromCharCode(65 + groupIndex);
                        // Auto-expand if user is in this group
                        const userInGroup = r.matches.some(
                            m => m.player1Id === currentPlayerId || m.player2Id === currentPlayerId
                        );
                        return (
                            <GroupSection
                                key={r.round}
                                groupLetter={letter}
                                matches={r.matches}
                                isDefaultOpen={userInGroup}
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
                    <h3 className="text-xs font-bold text-foreground/50 uppercase tracking-wider flex items-center gap-2">
                        ⚔️ Knockout Stage
                    </h3>
                    <div className="flex items-center justify-end">
                        <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
                    </div>
                    <div ref={containerRef} className="overflow-x-auto pb-4">
                        <div style={{ zoom }} className="flex items-start w-max">
                            {koRounds.map((round, ri) => {
                                const mult = Math.pow(2, ri);
                                const gap = ri === 0 ? GAP : (MATCH_H + GAP) * mult - MATCH_H;
                                const padTop = ri === 0 ? 0 : ((MATCH_H + GAP) * mult - MATCH_H - GAP) / 2;
                                const mainMatches = round.matches.filter(m => ri < koRounds.length - 1 || m.position !== 1);

                                return (
                                    <div key={round.round} className="flex items-start">
                                        <div style={{ paddingTop: padTop }}>
                                            <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider text-center mb-2">
                                                {koRoundName(round.round)}
                                            </p>
                                            <div className="flex flex-col" style={{ gap }}>
                                                {mainMatches.map(m => (
                                                    <CompactMatch key={m.id} match={m} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                                                ))}
                                            </div>
                                        </div>

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

                            {/* Trophy */}
                            {(() => {
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
                    {(() => {
                        const lastRound = koRounds[koRounds.length - 1];
                        const thirdMatch = lastRound?.matches.find(m => m.position === 1);
                        if (!thirdMatch) return null;
                        return (
                            <div className="max-w-xs">
                                <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-2">🥉 3rd Place</p>
                                <CompactMatch match={thirdMatch} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
