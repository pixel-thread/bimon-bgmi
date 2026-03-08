"use client";

import { Trophy } from "lucide-react";
import { CompactMatch, MatchRow, MyBracketMatch, BracketMatchData, RoundData, usePinchZoom, ZoomControls } from "./bracket-shared";

export type { BracketMatchData, RoundData };
export { MyBracketMatch };

/* ─── KO Bracket Tree ───────────────────────────────────────── */

interface BracketViewProps {
    rounds: RoundData[];
    totalRounds: number;
    currentPlayerId?: string;
    isAdmin?: boolean;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}

export function BracketView({
    rounds,
    totalRounds,
    currentPlayerId,
    isAdmin,
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

    // Detect tournament type: if all rounds are positive it's KO, otherwise it has groups
    const positiveRounds = rounds.filter(r => r.round > 0).sort((a, b) => a.round - b.round);
    const isLeague = positiveRounds.length > 0 && positiveRounds[0].matches.length > 1 && rounds.every(r => r.round > 0);

    if (isLeague) {
        return (
            <LeagueView
                rounds={positiveRounds}
                currentPlayerId={currentPlayerId}
                isAdmin={isAdmin}
                onSubmitResult={onSubmitResult}
                onConfirmResult={onConfirmResult}
                onDispute={onDispute}
                onViewResult={onViewResult}
            />
        );
    }

    return (
        <KOBracketTree
            rounds={rounds}
            currentPlayerId={currentPlayerId}
            onViewResult={onViewResult}
        />
    );
}

/* ─── KO Bracket Tree ──────────────────────────────────────── */

function KOBracketTree({
    rounds,
    currentPlayerId,
    onViewResult,
}: {
    rounds: RoundData[];
    currentPlayerId?: string;
    onViewResult?: (id: string) => void;
}) {
    const { zoom, zoomIn, zoomOut, reset, containerRef } = usePinchZoom();
    const MATCH_H = 51; // 2×h-6(24px) rows + 1px divider + 2px border = 51px exact
    const GAP = 8;
    const CONN_W = 20; // width of connector column

    // Separate 3rd place match from final round (position===1 in last round = 3rd place)
    const thirdPlaceMatch = rounds.length > 0
        ? rounds[rounds.length - 1]?.matches.find(m => m.position === 1)
        : null;

    const bracketRounds = rounds.map((round, ri) => {
        if (ri === rounds.length - 1 && thirdPlaceMatch) {
            return { ...round, name: "Final", matches: round.matches.filter(m => m.position !== 1) };
        }
        return round;
    });

    return (
        <div className="space-y-3">
            {/* Zoom controls */}
            <div className="flex items-center justify-end">
                <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
            </div>
            <div ref={containerRef} className="overflow-x-auto pb-4">
                <div style={{ zoom }} className="flex items-start w-max">
                    {bracketRounds.map((round, ri) => {
                        const mult = Math.pow(2, ri);
                        const gap = ri === 0 ? GAP : (MATCH_H + GAP) * mult - MATCH_H;
                        const padTop = ri === 0 ? 0 : ((MATCH_H + GAP) * mult - MATCH_H - GAP) / 2;

                        return (
                            <div key={round.round} className="flex items-start">
                                <div style={{ paddingTop: padTop }}>
                                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider text-center mb-2">{round.name}</p>
                                    <div className="flex flex-col" style={{ gap }}>
                                        {round.matches.map(m => (
                                            <CompactMatch key={m.id} match={m} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                                        ))}
                                    </div>
                                </div>

                                {ri < bracketRounds.length - 1 && (
                                    <div style={{ paddingTop: padTop }}>
                                        <p className="text-[10px] opacity-0 mb-2">.</p>
                                        <div className="flex flex-col" style={{ gap }}>
                                            {Array.from({ length: Math.ceil(round.matches.length / 2) }).map((_, pi) => {
                                                const pair = round.matches.slice(pi * 2, pi * 2 + 2);
                                                const done = pair.every(m => m.status === "CONFIRMED" || m.status === "BYE");
                                                const lc = done ? "border-success/40" : "border-foreground/15";
                                                const h = pair.length === 2 ? MATCH_H * 2 + gap : MATCH_H;
                                                const mid1 = MATCH_H / 2;           // mid of first match
                                                const mid2 = MATCH_H + gap + MATCH_H / 2; // mid of second match
                                                const centerY = (mid1 + mid2) / 2;   // vertical midpoint
                                                return (
                                                    <div key={pi} className="relative" style={{ height: h, width: CONN_W }}>
                                                        {pair.length === 2 ? (
                                                            <>
                                                                {/* Top horizontal stub from match 1 */}
                                                                <div className={`absolute left-0 border-t ${lc}`} style={{ width: CONN_W / 2, top: mid1 }} />
                                                                {/* Bottom horizontal stub from match 2 */}
                                                                <div className={`absolute left-0 border-t ${lc}`} style={{ width: CONN_W / 2, top: mid2 }} />
                                                                {/* Vertical bar connecting mid1 to mid2 */}
                                                                <div className={`absolute border-r ${lc}`} style={{ left: CONN_W / 2, top: mid1, bottom: h - mid2 }} />
                                                                {/* Horizontal out to next round */}
                                                                <div className={`absolute border-t ${lc}`} style={{ left: CONN_W / 2, right: 0, top: centerY }} />
                                                            </>
                                                        ) : (
                                                            // Bye / single match — straight through
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

                    {bracketRounds.length > 0 && (() => {
                        const winner = bracketRounds[bracketRounds.length - 1]?.matches[0]?.winner;
                        return (
                            <div className="flex flex-col items-center justify-center min-w-[80px] gap-1 self-center ml-2">
                                <Trophy className={`h-7 w-7 ${winner ? "text-warning-500" : "text-foreground/15"}`} />
                                {winner ? (
                                    <p className="text-[11px] font-semibold text-center">{winner.displayName}</p>
                                ) : (
                                    <p className="text-[10px] text-foreground/25">TBD</p>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* 3rd Place Match */}
            {thirdPlaceMatch && (
                <div className="max-w-xs">
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mb-2">🥉 3rd Place Match</p>
                    <CompactMatch match={thirdPlaceMatch} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                </div>
            )}
        </div>
    );
}

/* ─── League View (match days list) ────────────────────────── */

function LeagueView({
    rounds,
    currentPlayerId,
    isAdmin,
    onSubmitResult,
    onConfirmResult,
    onDispute,
    onViewResult,
}: {
    rounds: RoundData[];
    currentPlayerId?: string;
    isAdmin?: boolean;
    onSubmitResult?: (id: string) => void;
    onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void;
    onViewResult?: (id: string) => void;
}) {
    return (
        <div className="space-y-4">
            {rounds.map(round => {
                const confirmedCount = round.matches.filter(m => m.status === "CONFIRMED").length;
                const totalCount = round.matches.filter(m => m.player1Id && m.player2Id).length;
                const allDone = confirmedCount === totalCount && totalCount > 0;

                return (
                    <div key={round.round} className="rounded-2xl border border-divider overflow-hidden">
                        <div className={`px-4 py-2.5 flex items-center justify-between ${allDone ? "bg-success/10" : "bg-default-50/60"}`}>
                            <span className="text-sm font-bold">{round.name}</span>
                            <span className={`text-[11px] font-medium ${allDone ? "text-success-600" : "text-foreground/40"}`}>
                                {confirmedCount}/{totalCount} done
                            </span>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {round.matches.filter(m => m.player1Id && m.player2Id).map(m => (
                                <MatchRow
                                    key={m.id}
                                    match={m}
                                    currentPlayerId={currentPlayerId}
                                    isAdmin={isAdmin}
                                    onSubmitResult={onSubmitResult}
                                    onConfirmResult={onConfirmResult}
                                    onDispute={onDispute}
                                    onViewResult={onViewResult}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

