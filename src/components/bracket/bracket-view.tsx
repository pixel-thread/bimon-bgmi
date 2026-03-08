"use client";

import { Trophy } from "lucide-react";
import { CompactMatch, MatchRow, MyBracketMatch, BracketMatchData, RoundData, usePinchZoom, ZoomControls } from "./bracket-shared";

export type { BracketMatchData, RoundData };
export { MyBracketMatch };

/* ─── BracketView (entry point) ─────────────────────────────── */

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

    // Detect tournament type: if all rounds are positive it's a league/round-robin
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

/* ─── KO Bracket Tree (SVG connectors) ─────────────────────── */

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

    /* ── Layout constants ─────────────────────────────────────── */
    const MATCH_W = 170; // CompactMatch width (w-[170px])
    const MATCH_H = 51;  // 2×h-6(24px) + 1px divider + 2px border = 51px exact
    const ROW_GAP = 8;   // gap between matches in round 0
    const COL_GAP = 28;  // horizontal gap between round columns (SVG lines go here)
    const LABEL_H = 22;  // height reserved for round name labels
    const TROPHY_W = 90;  // width for winner display

    /* ── 3rd place handling ───────────────────────────────────── */
    const thirdPlaceMatch = rounds.length > 0
        ? rounds[rounds.length - 1]?.matches.find(m => m.position === 1)
        : null;

    const bracketRounds = rounds.map((round, ri) => {
        if (ri === rounds.length - 1 && thirdPlaceMatch) {
            return { ...round, name: "Final", matches: round.matches.filter(m => m.position !== 1) };
        }
        return round;
    });

    const N = bracketRounds.length;
    if (N === 0) return null;

    /* ── Geometry helpers ─────────────────────────────────────── */

    /** Center-to-center vertical distance between matches in round ri */
    const matchSpacing = (ri: number) => (MATCH_H + ROW_GAP) * Math.pow(2, ri);

    /** Top padding of match column for round ri so centers align with round 0 */
    const colPadTop = (ri: number) =>
        ri === 0 ? 0 : (matchSpacing(ri) - MATCH_H - ROW_GAP) / 2;

    /** Absolute center-Y of match j in round ri (within the match area, below labels) */
    const matchCY = (ri: number, j: number) =>
        colPadTop(ri) + j * matchSpacing(ri) + MATCH_H / 2;

    /** Absolute left-X of round ri's column */
    const colLeft = (ri: number) => ri * (MATCH_W + COL_GAP);

    const n0 = bracketRounds[0].matches.length;
    const totalMatchH = n0 * MATCH_H + (n0 - 1) * ROW_GAP;
    const totalW = N * MATCH_W + (N - 1) * COL_GAP;

    /* ── Build SVG connector specs ────────────────────────────── */
    type Conn = { x1: number; y1a: number; y1b: number | null; midX: number; y2: number; done: boolean };
    const connectors: Conn[] = [];

    for (let ri = 0; ri < N - 1; ri++) {
        const round = bracketRounds[ri];
        const x1 = colLeft(ri) + MATCH_W;  // right edge of current round
        const x2 = colLeft(ri + 1);         // left edge of next round
        const midX = (x1 + x2) / 2;
        const pairs = Math.ceil(round.matches.length / 2);

        for (let p = 0; p < pairs; p++) {
            const m1 = round.matches[p * 2];
            const m2 = round.matches[p * 2 + 1] ?? null;
            const y1a = matchCY(ri, p * 2);
            const y1b = m2 ? matchCY(ri, p * 2 + 1) : null;
            const y2 = matchCY(ri + 1, p);
            const done = (m1.status === "CONFIRMED" || m1.status === "BYE") &&
                (!m2 || m2.status === "CONFIRMED" || m2.status === "BYE");
            connectors.push({ x1, y1a, y1b, midX, y2, done });
        }
    }

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="space-y-3">
            {/* Zoom controls */}
            <div className="flex items-center justify-end">
                <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
            </div>

            <div ref={containerRef} className="overflow-x-auto pb-4">
                {/* Zoom wrapper — explicit size so absolute children position correctly */}
                <div style={{ zoom, position: "relative", width: totalW + TROPHY_W, height: LABEL_H + totalMatchH }}>

                    {/* ── SVG connector layer ─────────────────────────────── */}
                    <svg
                        style={{ position: "absolute", top: LABEL_H, left: 0, width: totalW, height: totalMatchH, overflow: "visible" }}
                        className="pointer-events-none"
                    >
                        {connectors.map((c, i) => {
                            const color = c.done ? "#22c55e" : "#6b7280"; // green-500 or gray-500
                            const opac = c.done ? 0.6 : 0.35;
                            return (
                                <g key={i} stroke={color} strokeOpacity={opac} fill="none" strokeWidth={1.5}>
                                    {/* Stub from match-1 center to midX */}
                                    <line x1={c.x1} y1={c.y1a} x2={c.midX} y2={c.y1a} />
                                    {c.y1b !== null && <>
                                        {/* Stub from match-2 center to midX */}
                                        <line x1={c.x1} y1={c.y1b} x2={c.midX} y2={c.y1b} />
                                        {/* Vertical bar joining both stubs */}
                                        <line x1={c.midX} y1={c.y1a} x2={c.midX} y2={c.y1b} />
                                    </>}
                                    {/* Exit line from midX to left edge of next column */}
                                    <line x1={c.midX} y1={c.y2} x2={c.x1 + COL_GAP} y2={c.y2} />
                                </g>
                            );
                        })}
                    </svg>

                    {/* ── Round columns (absolutely positioned) ──────────── */}
                    {bracketRounds.map((round, ri) => {
                        const padTop = colPadTop(ri);
                        const itemGap = matchSpacing(ri) - MATCH_H; // gap between CompactMatch cards
                        return (
                            <div
                                key={round.round}
                                style={{ position: "absolute", left: colLeft(ri), top: 0, width: MATCH_W }}
                            >
                                {/* Round label */}
                                <p
                                    className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider text-center"
                                    style={{ height: LABEL_H, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 3 }}
                                >
                                    {round.name}
                                </p>
                                {/* Match cards */}
                                <div style={{ display: "flex", flexDirection: "column", gap: itemGap, marginTop: padTop }}>
                                    {round.matches.map(m => (
                                        <CompactMatch
                                            key={m.id}
                                            match={m}
                                            currentPlayerId={currentPlayerId}
                                            onViewResult={onViewResult}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* ── Winner trophy ───────────────────────────────────── */}
                    {(() => {
                        const winner = bracketRounds[N - 1]?.matches[0]?.winner;
                        const trophyTop = LABEL_H + matchCY(N - 1, 0) - 28;
                        return (
                            <div
                                style={{ position: "absolute", left: totalW + 8, top: trophyTop, width: TROPHY_W - 8 }}
                                className="flex flex-col items-center gap-1"
                            >
                                <Trophy className={`h-7 w-7 ${winner ? "text-warning-500" : "text-foreground/15"}`} />
                                {winner
                                    ? <p className="text-[11px] font-semibold text-center">{winner.displayName}</p>
                                    : <p className="text-[10px] text-foreground/25">TBD</p>
                                }
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
