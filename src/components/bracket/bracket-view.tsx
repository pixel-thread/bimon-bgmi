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
    const positive = rounds.filter(r => r.round > 0).sort((a, b) => a.round - b.round);
    const isLeague = positive.length > 0 && positive[0].matches.length > 1 && rounds.every(r => r.round > 0);
    if (isLeague) {
        return <LeagueView rounds={positive} currentPlayerId={currentPlayerId} isAdmin={isAdmin}
            onSubmitResult={onSubmitResult} onConfirmResult={onConfirmResult} onDispute={onDispute} onViewResult={onViewResult} />;
    }
    return <KOBracket rounds={rounds} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />;
}

/* ─── KO Bracket ────────────────────────────────────────────── */
const MATCH_W = 170;
const MATCH_H = 51;  // 2×h-6(24px) + 1px divider + 2px border
const ROW_GAP = 8;
const COL_GAP = 36;
const LABEL_H = 28;  // fixed height for all round labels

function KOBracket({ rounds, currentPlayerId, onViewResult }: { rounds: RoundData[]; currentPlayerId?: string; onViewResult?: (id: string) => void }) {
    const { zoom, zoomIn, zoomOut, reset, containerRef: scrollRef } = usePinchZoom();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const svgGroupRef = useRef<SVGGElement>(null);
    const cardRefs = useRef<Record<string, HTMLDivElement>>({});

    /* 3rd place */
    const thirdPlace = rounds.at(-1)?.matches.find(m => m.position === 1) ?? null;
    const bRounds = rounds.map((r, ri) =>
        ri === rounds.length - 1 && thirdPlace
            ? { ...r, name: "Final", matches: r.matches.filter(m => m.position !== 1) }
            : r
    );
    const N = bRounds.length;

    /* Geometry */
    const spacing = (ri: number) => (MATCH_H + ROW_GAP) * Math.pow(2, ri);
    const padTop = (ri: number) => ri === 0 ? 0 : (spacing(ri) - MATCH_H - ROW_GAP) / 2;
    const itemGap = (ri: number) => spacing(ri) - MATCH_H;
    const colLeft = (ri: number) => ri * (MATCH_W + COL_GAP);

    /* Draw SVG lines directly into DOM — no state needed */
    useLayoutEffect(() => {
        const g = svgGroupRef.current;
        const wrapper = wrapperRef.current;
        if (!g || !wrapper || N === 0) return;

        while (g.firstChild) g.removeChild(g.firstChild);

        const wr = wrapper.getBoundingClientRect();
        const px = (sx: number) => (sx - wr.left) / zoom;
        const py = (sy: number) => (sy - wr.top) / zoom;

        const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, op: number) => {
            const el = document.createElementNS("http://www.w3.org/2000/svg", "line");
            el.setAttribute("x1", `${x1}`); el.setAttribute("y1", `${y1}`);
            el.setAttribute("x2", `${x2}`); el.setAttribute("y2", `${y2}`);
            el.setAttribute("stroke", stroke);
            el.setAttribute("stroke-width", "1.5");
            el.setAttribute("stroke-opacity", `${op}`);
            el.setAttribute("stroke-linecap", "round");
            g.appendChild(el);
        };

        for (let ri = 0; ri < N - 1; ri++) {
            const cur = bRounds[ri];
            const nxt = bRounds[ri + 1];
            if (!nxt) continue;
            for (let p = 0; p < Math.ceil(cur.matches.length / 2); p++) {
                const m1 = cur.matches[p * 2];
                const m2 = cur.matches[p * 2 + 1] ?? null;
                const mN = nxt.matches[p];
                if (!mN) continue;
                const e1 = cardRefs.current[m1.id];
                const eN = cardRefs.current[mN.id];
                if (!e1 || !eN) continue;

                const r1 = e1.getBoundingClientRect();
                const rN = eN.getBoundingClientRect();
                const x1 = px(r1.right);
                const y1a = py(r1.top + r1.height / 2);
                const x2 = px(rN.left);
                const y2 = py(rN.top + rN.height / 2);
                const midX = (x1 + x2) / 2;

                const done = (m1.status === "CONFIRMED" || m1.status === "BYE") &&
                    (!m2 || m2.status === "CONFIRMED" || m2.status === "BYE");
                const color = done ? "#22c55e" : "#6b7280";
                const op = done ? 0.6 : 0.35;

                if (m2) {
                    const e2 = cardRefs.current[m2.id];
                    if (e2) {
                        const r2 = e2.getBoundingClientRect();
                        const y1b = py(r2.top + r2.height / 2);
                        line(x1, y1a, midX, y1a, color, op);
                        line(x1, y1b, midX, y1b, color, op);
                        line(midX, y1a, midX, y1b, color, op);
                        line(midX, y2, x2, y2, color, op);
                    }
                } else {
                    line(x1, y1a, x2, y1a, color, op);
                }
            }
        }
    }); // no deps → runs after every render

    if (N === 0) return null;
    const n0 = bRounds[0].matches.length;
    const totalMatchH = n0 * MATCH_H + (n0 - 1) * ROW_GAP;
    const totalW = N * MATCH_W + (N - 1) * COL_GAP + 72; // 72px trophy column
    const winner = bRounds[N - 1]?.matches[0]?.winner;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-end">
                <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={reset} />
            </div>

            <div ref={scrollRef} className="overflow-x-auto pb-4">
                {/* zoom wrapper — explicit width so overflow-x-auto triggers */}
                <div style={{ zoom, width: totalW }} className="relative" ref={wrapperRef}>

                    {/* ── Label row: all at same y, fixed height ── */}
                    <div className="flex" style={{ height: LABEL_H, marginBottom: 4 }}>
                        {bRounds.map((r, ri) => (
                            <div key={`lbl-${ri}`} style={{ width: MATCH_W, marginRight: ri < N - 1 ? COL_GAP : 0, flexShrink: 0 }}
                                className="flex items-end justify-center pb-1">
                                <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                                    {r.name}
                                </span>
                            </div>
                        ))}
                        {/* trophy column spacer */}
                        <div style={{ width: 72 }} />
                    </div>

                    {/* ── Match area with SVG overlay ── */}
                    <div className="relative" style={{ height: totalMatchH, width: totalW }}>
                        {/* SVG covers the match area */}
                        <svg className="absolute inset-0 pointer-events-none"
                            style={{ width: "100%", height: "100%", overflow: "visible" }}>
                            <g ref={svgGroupRef} />
                        </svg>

                        {/* Round columns — absolutely positioned so labels are decoupled */}
                        {bRounds.map((r, ri) => (
                            <div key={r.round}
                                style={{ position: "absolute", left: colLeft(ri), top: padTop(ri), width: MATCH_W }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: itemGap(ri) }}>
                                    {r.matches.map(m => (
                                        <div key={m.id} ref={el => { if (el) cardRefs.current[m.id] = el; }}>
                                            <CompactMatch match={m} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Trophy */}
                        <div style={{ position: "absolute", left: colLeft(N), top: padTop(N - 1) + MATCH_H / 2 - 26, width: 60 }}
                            className="flex flex-col items-center gap-1 pl-2">
                            <Trophy className={`h-6 w-6 ${winner ? "text-yellow-400" : "text-foreground/15"}`} />
                            <p className={`text-[9px] font-semibold text-center leading-tight ${winner ? "text-yellow-400" : "text-foreground/25"}`}>
                                {winner?.displayName ?? "TBD"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {thirdPlace && (
                <div className="max-w-[170px]">
                    <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest mb-2">🥉 3rd Place</p>
                    <div ref={el => { if (el) cardRefs.current[thirdPlace.id] = el; }}>
                        <CompactMatch match={thirdPlace} currentPlayerId={currentPlayerId} onViewResult={onViewResult} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── League View ───────────────────────────────────────────── */
function LeagueView({ rounds, currentPlayerId, isAdmin, onSubmitResult, onConfirmResult, onDispute, onViewResult }: {
    rounds: RoundData[]; currentPlayerId?: string; isAdmin?: boolean;
    onSubmitResult?: (id: string) => void; onConfirmResult?: (id: string) => void;
    onDispute?: (id: string) => void; onViewResult?: (id: string) => void;
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
