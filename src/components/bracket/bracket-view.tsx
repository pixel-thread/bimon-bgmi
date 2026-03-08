"use client";

import { useRef, useLayoutEffect } from "react";
import { Trophy } from "lucide-react";
import { CompactMatch, MatchRow, MyBracketMatch, BracketMatchData, RoundData, usePinchZoom, ZoomControls } from "./bracket-shared";

export type { BracketMatchData, RoundData };
export { MyBracketMatch };

/* ─── Entry point ───────────────────────────────────────────── */

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

export function BracketView({ rounds, totalRounds, currentPlayerId, isAdmin, onSubmitResult, onConfirmResult, onDispute, onViewResult }: BracketViewProps) {
    if (rounds.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Trophy className="h-10 w-10 text-foreground/20" />
                <p className="text-foreground/50 text-sm">Bracket not generated yet</p>
            </div>
        );
    }

    const positiveRounds = rounds.filter(r => r.round > 0).sort((a, b) => a.round - b.round);
    const isLeague = positiveRounds.length > 0 && positiveRounds[0].matches.length > 1 && rounds.every(r => r.round > 0);

    if (isLeague) {
        return <LeagueView rounds={positiveRounds} currentPlayerId={currentPlayerId} isAdmin={isAdmin} onSubmitResult={onSubmitResult} onConfirmResult={onConfirmResult} onDispute={onDispute} onViewResult={onViewResult} />;
    }

    return <KOBracketTree rounds={rounds} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />;
}

/* ─── KO Bracket (ref-based SVG connectors) ─────────────────── */

function KOBracketTree({ rounds, currentPlayerId, onViewResult }: {
    rounds: RoundData[];
    currentPlayerId?: string;
    onViewResult?: (id: string) => void;
}) {
    const { zoom, zoomIn, zoomOut, reset, containerRef: scrollRef } = usePinchZoom();

    const wrapperRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGGElement>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement>>({});

    const MATCH_H = 51;
    const ROW_GAP = 8;
    const COL_GAP = 40;

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

    const matchSpacing = (ri: number) => (MATCH_H + ROW_GAP) * Math.pow(2, ri);
    const colPadTop = (ri: number) => ri === 0 ? 0 : (matchSpacing(ri) - MATCH_H - ROW_GAP) / 2;
    const colItemGap = (ri: number) => matchSpacing(ri) - MATCH_H;

    /* Draw SVG lines directly — no state, no re-render loop */
    useLayoutEffect(() => {
        const g = svgRef.current;
        const wrapper = wrapperRef.current;
        if (!g || !wrapper || N === 0) return;

        // Clear old lines
        while (g.firstChild) g.removeChild(g.firstChild);

        const wRect = wrapper.getBoundingClientRect();
        // CSS zoom: getBoundingClientRect returns visual (scaled) coords in Chrome
        const toX = (sx: number) => (sx - wRect.left) / zoom;
        const toY = (sy: number) => (sy - wRect.top) / zoom;

        const mkLine = (x1: number, y1: number, x2: number, y2: number, color: string, opacity: number) => {
            const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
            el.setAttribute("x1", `${x1}`); el.setAttribute("y1", `${y1}`);
            el.setAttribute("x2", `${x2}`); el.setAttribute("y2", `${y2}`);
            el.setAttribute("stroke", color);
            el.setAttribute("stroke-width", "1.5");
            el.setAttribute("stroke-opacity", `${opacity}`);
            el.setAttribute("stroke-linecap", "round");
            g.appendChild(el);
        };

        for (let ri = 0; ri < N - 1; ri++) {
            const cur = bracketRounds[ri];
            const next = bracketRounds[ri + 1];
            if (!next) continue;

            for (let p = 0; p < Math.ceil(cur.matches.length / 2); p++) {
                const m1 = cur.matches[p * 2];
                const m2 = cur.matches[p * 2 + 1] ?? null;
                const mN = next.matches[p];
                if (!mN) continue;

                const el1 = cardRefs.current[m1.id];
                const elN = cardRefs.current[mN.id];
                if (!el1 || !elN) continue;

                const r1 = el1.getBoundingClientRect();
                const rN = elN.getBoundingClientRect();
                const x1 = toX(r1.right);
                const y1a = toY(r1.top + r1.height / 2);
                const x2 = toX(rN.left);
                const y2 = toY(rN.top + rN.height / 2);
                const midX = (x1 + x2) / 2;

                const done = (m1.status === "CONFIRMED" || m1.status === "BYE") &&
                    (!m2 || m2.status === "CONFIRMED" || m2.status === "BYE");
                const color = done ? "#22c55e" : "#6b7280";
                const opac = done ? 0.55 : 0.35;

                if (m2) {
                    const el2 = cardRefs.current[m2.id];
                    if (el2) {
                        const r2 = el2.getBoundingClientRect();
                        const y1b = toY(r2.top + r2.height / 2);
                        mkLine(x1, y1a, midX, y1a, color, opac); // top stub
                        mkLine(x1, y1b, midX, y1b, color, opac); // bottom stub
                        mkLine(midX, y1a, midX, y1b, color, opac); // vertical
                        mkLine(midX, y2, x2, y2, color, opac); // exit
                    }
                } else {
                    mkLine(x1, y1a, x2, y2, color, opac); // bye: straight through
                }
            }
        }
    }); // intentionally no deps — runs after every render so zoom/data changes update lines

    if (N === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-end">
                <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
            </div>

            <div ref={scrollRef} className="overflow-x-auto pb-4">
                <div style={{ zoom }} className="relative inline-flex" ref={wrapperRef}>
                    {/* SVG layer — covers entire wrapper */}
                    <svg className="absolute inset-0 pointer-events-none"
                        style={{ width: "100%", height: "100%", overflow: "visible" }}>
                        <g ref={svgRef} />
                    </svg>

                    {/* Round columns */}
                    <div className="flex items-start">
                        {bracketRounds.map((round, ri) => (
                            <div key={round.round} style={{ paddingTop: colPadTop(ri), width: 170, marginRight: ri < N - 1 ? COL_GAP : 0 }}>
                                <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest text-center mb-2">
                                    {round.name}
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: colItemGap(ri) }}>
                                    {round.matches.map(m => (
                                        <div key={m.id} ref={el => { if (el) cardRefs.current[m.id] = el; }}>
                                            <CompactMatch match={m} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Winner trophy */}
                        {(() => {
                            const winner = bracketRounds[N - 1]?.matches[0]?.winner;
                            return (
                                <div style={{ paddingTop: colPadTop(N - 1) + MATCH_H / 2 - 28, width: 72 }}
                                    className="flex flex-col items-center gap-1 pl-2">
                                    <Trophy className={`h-7 w-7 ${winner ? "text-yellow-400" : "text-foreground/15"}`} />
                                    <p className={`text-[10px] font-semibold text-center leading-tight ${winner ? "text-yellow-400" : "text-foreground/25"}`}>
                                        {winner?.displayName ?? "TBD"}
                                    </p>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {thirdPlaceMatch && (
                <div className="max-w-xs">
                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">🥉 3rd Place</p>
                    <div ref={el => { if (el) cardRefs.current[thirdPlaceMatch.id] = el; }}>
                        <CompactMatch match={thirdPlaceMatch} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── League View ───────────────────────────────────────────── */

function LeagueView({ rounds, currentPlayerId, isAdmin, onSubmitResult, onConfirmResult, onDispute, onViewResult }: {
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
                const confirmed = round.matches.filter(m => m.status === "CONFIRMED").length;
                const total = round.matches.filter(m => m.player1Id && m.player2Id).length;
                const allDone = confirmed === total && total > 0;
                return (
                    <div key={round.round} className="rounded-2xl border border-divider overflow-hidden">
                        <div className={`px-4 py-2.5 flex items-center justify-between ${allDone ? "bg-success/10" : "bg-default-50/60"}`}>
                            <span className="text-sm font-bold">{round.name}</span>
                            <span className={`text-[11px] font-medium ${allDone ? "text-success-600" : "text-foreground/40"}`}>{confirmed}/{total} done</span>
                        </div>
                        <div className="p-3 space-y-1.5">
                            {round.matches.filter(m => m.player1Id && m.player2Id).map(m => (
                                <MatchRow key={m.id} match={m} currentPlayerId={currentPlayerId} isAdmin={isAdmin}
                                    onSubmitResult={onSubmitResult} onConfirmResult={onConfirmResult}
                                    onDispute={onDispute} onViewResult={onViewResult} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
