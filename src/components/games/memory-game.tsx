"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Tabs, Tab, Avatar, Skeleton } from "@heroui/react";
import { RotateCcw, Trophy, Timer, MousePointerClick, Gamepad2, Medal, Heart, Square } from "lucide-react";
import { AdSlot } from "@/components/common/AdSlot";
import { CurrencyIcon } from "@/components/common/CurrencyIcon";

/* ── Config ────────────────────────────────────────────── */
const EMOJI_SETS = [
    ["🐶", "🐱", "🐼", "🦊", "🐸", "🦁", "🐯", "🐰", "🐻", "🐨", "🐵", "🦄"],
    ["🍕", "🍔", "🍟", "🌮", "🍩", "🍪", "🎂", "🍦", "🍫", "🍿", "☕", "🧃"],
    ["⚽", "🏀", "🎾", "🏐", "🎱", "🏓", "🎯", "🏆", "🎪", "🎨", "🎸", "🎲"],
    ["🚀", "✈️", "🚁", "🚂", "🏎️", "🚢", "🛸", "🎡", "🌋", "⛰️", "🌊", "🌈"],
];

const PAIRS = 10;
const COLS = "grid-cols-5";
const MAX_HEARTS = 5;
const HEART_REGEN_MS = 10 * 60 * 1000;

interface Card { id: number; emoji: string; isFlipped: boolean; isMatched: boolean; }

interface ServerScore {
    rank: number; score: number;
    displayName: string; imageUrl: string | null; playerId: string;
}

function calcScore(moves: number, time: number): number {
    return Math.max(0, 1000 - (moves * 10) - time);
}

function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function createCards(): Card[] {
    const emojiSet = EMOJI_SETS[Math.floor(Math.random() * EMOJI_SETS.length)];
    const selected = shuffleArray(emojiSet).slice(0, PAIRS);
    const cards = [...selected, ...selected].map((emoji, i) => ({
        id: i, emoji, isFlipped: false, isMatched: false,
    }));
    return shuffleArray(cards);
}

function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/* ── Hearts ─────────────────────────────────────────────── */
function loadHearts(): { count: number; lastUsed: number } {
    try {
        const saved = localStorage.getItem("memory-hearts");
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { count: MAX_HEARTS, lastUsed: Date.now() };
}

function saveHearts(count: number) {
    localStorage.setItem("memory-hearts", JSON.stringify({ count, lastUsed: Date.now() }));
}

function getRegenedHearts(saved: { count: number; lastUsed: number }): number {
    if (saved.count >= MAX_HEARTS) return MAX_HEARTS;
    const elapsed = Date.now() - saved.lastUsed;
    const regened = Math.floor(elapsed / HEART_REGEN_MS);
    return Math.min(MAX_HEARTS, saved.count + regened);
}

/* ── Leaderboard ────────────────────────────────────────── */
function Leaderboard() {
    const { data, isLoading } = useQuery<{ scores: ServerScore[]; rewards: Record<string, number> }>({
        queryKey: ["game-leaderboard"],
        queryFn: async () => {
            const res = await fetch("/api/games/leaderboard");
            return res.json();
        },
        staleTime: 30_000,
    });

    const scores = data?.scores || [];
    const rewards = data?.rewards || {};
    const topPrize = rewards["1"] || 0;

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
            </div>
        );
    }
    if (scores.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-default-100 py-12 text-center">
                <Medal className="h-10 w-10 text-foreground/20" />
                <div>
                    <p className="font-medium text-foreground/60">No scores yet</p>
                    <p className="text-sm text-foreground/40">Be the first to set a score!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Prize banner */}
            {topPrize > 0 && (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-500">
                        #1 wins {topPrize} <CurrencyIcon size={12} />
                    </span>
                    {rewards["2"] && <span className="text-xs text-foreground/40">• #2: {rewards["2"]}</span>}
                    {rewards["3"] && <span className="text-xs text-foreground/40">• #3: {rewards["3"]}</span>}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 rounded-lg bg-default-100 px-4 py-2 text-xs font-semibold text-foreground/50">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">Player</span>
                <span className="w-16 text-right">Points</span>
            </div>

            {/* Rows */}
            {scores.map((entry) => (
                <div
                    key={entry.playerId}
                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                        entry.rank === 1
                            ? "bg-amber-500/15 border border-amber-500/25 shadow-sm"
                            : entry.rank <= 3
                                ? "bg-amber-500/5"
                                : "hover:bg-default-100"
                    }`}
                >
                    <span className={`w-8 text-center text-xs font-medium ${
                        entry.rank === 1 ? "text-yellow-500 text-sm" : entry.rank === 2 ? "text-foreground/50" : entry.rank === 3 ? "text-orange-400" : "text-foreground/30"
                    }`}>
                        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                    </span>
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                        <Avatar src={entry.imageUrl || undefined} name={entry.displayName} size="sm" className={`shrink-0 ${entry.rank === 1 ? "h-8 w-8 ring-2 ring-amber-500/50" : "h-7 w-7"}`} />
                        <span className={`font-medium truncate ${entry.rank === 1 ? "text-sm text-amber-500" : "text-sm"}`}>{entry.displayName}</span>
                    </div>
                    <span className={`w-16 text-right font-bold ${entry.rank === 1 ? "text-base game-text" : "text-sm game-text"}`}>{entry.score}</span>
                </div>
            ))}
        </div>
    );
}

/* ── Main game ─────────────────────────────────────────── */
export function MemoryGame() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<string>("play");
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedIds, setFlippedIds] = useState<number[]>([]);
    const [wrongIds, setWrongIds] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [isStopped, setIsStopped] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [isNewBest, setIsNewBest] = useState(false);
    const [hearts, setHearts] = useState(MAX_HEARTS);
    const [showNoHearts, setShowNoHearts] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [regenCountdown, setRegenCountdown] = useState("");
    const [personalBest, setPersonalBest] = useState(0);
    const [gameCount, setGameCount] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load personal best from server
    useEffect(() => {
        fetch("/api/games/leaderboard")
            .then(r => r.json())
            .then(data => { if (data.myBest) setPersonalBest(data.myBest); })
            .catch(() => {});
    }, []);

    // Hearts regen + countdown
    useEffect(() => {
        function tick() {
            const saved = loadHearts();
            const current = getRegenedHearts(saved);
            setHearts(current);

            // Auto-dismiss "out of hearts" when a heart regens
            if (current > 0) setShowNoHearts(false);

            if (current < MAX_HEARTS) {
                const elapsed = Date.now() - saved.lastUsed;
                const heartsSoFar = Math.floor(elapsed / HEART_REGEN_MS);
                const rem = HEART_REGEN_MS - (elapsed - heartsSoFar * HEART_REGEN_MS);
                setRegenCountdown(`${Math.floor(rem / 60000)}:${Math.floor((rem % 60000) / 1000).toString().padStart(2, "0")}`);
            } else setRegenCountdown("");
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // Game timer
    useEffect(() => {
        if (isRunning) timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning]);

    // Auto-start on mount
    useEffect(() => { startGame(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Save score
    const saveScore = useCallback(async (m: number, t: number) => {
        const sc = calcScore(m, t);
        try {
            const res = await fetch("/api/games/leaderboard", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score: sc, moves: m, time: t }),
            });
            const data = await res.json();
            if (data.isNewBest) { setIsNewBest(true); setPersonalBest(sc); }
            queryClient.invalidateQueries({ queryKey: ["game-leaderboard"] });
        } catch { /* silent */ }
    }, [queryClient]);

    // Start / restart — just deal cards, no heart consumed yet
    const startGame = useCallback(() => {
        setCards(createCards());
        setFlippedIds([]); setWrongIds([]); setMoves(0); setTime(0);
        setIsRunning(false); setIsStopped(false); setGameWon(false); setIsNewBest(false);
        setShowNoHearts(false); setHasStarted(true); setTab("play");
        setGameCount(c => c + 1);
    }, []);

    // Stop — freeze timer + lock cards
    function stopGame() {
        setIsRunning(false);
        setIsStopped(true);
    }

    // Card click
    function handleCardClick(id: number) {
        if (flippedIds.length >= 2 || gameWon || isStopped) return;
        const card = cards.find(c => c.id === id);
        if (!card || card.isFlipped || card.isMatched) return;

        // First flip — consume a heart
        if (!isRunning) {
            const saved = loadHearts();
            const current = getRegenedHearts(saved);
            if (current <= 0) { setShowNoHearts(true); setHearts(0); return; }
            setHearts(current - 1);
            saveHearts(current - 1);
            setIsRunning(true);
        }

        const newFlipped = [...flippedIds, id];
        setFlippedIds(newFlipped);
        setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [a, b] = newFlipped;
            const ca = cards.find(c => c.id === a)!;
            const cb = cards.find(c => c.id === b)!;

            if (ca.emoji === cb.emoji) {
                setTimeout(() => {
                    setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, isMatched: true } : c));
                    setFlippedIds([]);
                    if (cards.filter(c => !c.isMatched && c.id !== a && c.id !== b).length === 0) {
                        setIsRunning(false); setGameWon(true); saveScore(moves + 1, time);
                    }
                }, 500);
            } else {
                setWrongIds([a, b]);
                setTimeout(() => {
                    setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, isFlipped: false } : c));
                    setFlippedIds([]); setWrongIds([]);
                }, 900);
            }
        }
    }

    const score = calcScore(moves, time);

    function cardClass(card: Card) {
        const c = ["flip-card", "aspect-square", "select-none"];
        if (card.isMatched) c.push("flipped", "matched");
        else if (card.isFlipped) c.push("flipped");
        if (wrongIds.includes(card.id)) c.push("wrong");
        if (!card.isMatched && !card.isFlipped && !gameWon) c.push("cursor-pointer");
        return c.join(" ");
    }

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 game-text" />
                        <h1 className="text-lg font-bold">Memory Game</h1>
                    </div>
                    <p className="text-sm text-foreground/50">Fewer moves + faster time = higher score</p>
                </div>
                <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                        <Heart key={i} className={`h-4 w-4 transition-all ${i < hearts ? "text-red-500 fill-red-500" : "text-foreground/15 scale-90"}`} />
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <Tabs selectedKey={tab} onSelectionChange={(k) => {
                const newTab = k as string;
                if (newTab === "play" && gameWon) startGame();
                setTab(newTab);
            }} variant="underlined" classNames={{ tabList: "w-full", tab: "flex-1" }} className="mb-4">
                <Tab key="play" title={<div className="flex items-center gap-1.5"><Gamepad2 className="h-4 w-4" /><span>Play</span></div>} />
                <Tab key="leaderboard" title={<div className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /><span>Leaderboard</span></div>} />
            </Tabs>

            {tab === "play" ? (
                <>
                    {showNoHearts ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl bg-default-100 py-12 text-center">
                            <div className="flex gap-1">
                                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                                    <Heart key={i} className="h-6 w-6 text-foreground/15" />
                                ))}
                            </div>
                            <div>
                                <p className="font-medium text-foreground/60">Out of hearts!</p>
                                <p className="text-sm text-foreground/40 mt-1">Hearts regenerate 1 every 10 minutes</p>
                                <p className="text-2xl font-bold text-foreground/70 mt-3">
                                    ⏱ {regenCountdown || "..."}
                                </p>
                                <p className="text-xs text-foreground/30 mt-1">until next heart</p>
                            </div>
                            {gameCount >= 3 && <AdSlot format="banner" className="mt-2 w-full rounded-lg overflow-hidden" />}
                        </div>
                    ) : !hasStarted ? (
                        <div className="flex items-center justify-center py-16">
                            <Gamepad2 className="h-8 w-8 text-foreground/20 animate-pulse" />
                        </div>
                    ) : (
                        <>
                            {/* Stats — moves, best, timer */}
                            <div className="mb-3 flex items-center justify-between rounded-lg bg-default-100 px-4 py-2.5">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <MousePointerClick className="h-4 w-4 text-foreground/40" />
                                    <span className="font-semibold">{moves}</span>
                                </div>
                                <div className="text-xs text-foreground/40">
                                    Best: <span className="font-semibold text-foreground/60">{personalBest > 0 ? personalBest : "—"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Timer className="h-4 w-4 text-foreground/40" />
                                    <span className="font-semibold">{formatTime(time)}</span>
                                </div>
                            </div>

                            {/* 5×4 flip card grid */}
                            <div className={`grid ${COLS} gap-1.5 sm:gap-2`}>
                                {cards.map(card => (
                                    <div key={card.id} className={cardClass(card)} onClick={() => handleCardClick(card.id)} onDoubleClick={(e) => e.preventDefault()}>
                                        <div className="flip-card-inner">
                                            <div className="flip-card-front bg-default-100 border-2 border-default-200 hover:bg-default-200 transition-colors">
                                                <span className="text-base sm:text-lg text-foreground/15 select-none">?</span>
                                            </div>
                                            <div className={`flip-card-back text-xl sm:text-3xl select-none ${
                                                card.isMatched
                                                    ? "bg-success/15 border-2 border-success/30 opacity-50"
                                                    : wrongIds.includes(card.id)
                                                        ? "bg-danger/15 border-2 border-danger/30"
                                                        : "bg-primary/15 border-2 border-primary/30"
                                            }`}>
                                                {card.emoji}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Stop + Reset below grid — only after first flip */}
                            {(moves > 0 || isRunning || isStopped) && !gameWon && (
                                <>
                                    <div className="mt-3 flex gap-2">
                                        {!isStopped && (
                                            <Button size="sm" variant="flat" color="danger" className="flex-1" onPress={stopGame} startContent={<Square className="h-3.5 w-3.5 fill-current" />}>
                                                Stop
                                            </Button>
                                        )}
                                        <Button size="sm" variant="flat" className="flex-1" onPress={() => startGame()} startContent={<RotateCcw className="h-3.5 w-3.5" />}>
                                            Reset
                                        </Button>
                                    </div>
                                </>
                            )}

                            {/* Win modal */}
                            {gameWon && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                                    <div className="w-full max-w-sm rounded-2xl bg-background border border-divider p-6 text-center space-y-4 shadow-2xl">
                                        <div className="text-5xl">🎉</div>
                                        <div>
                                            <p className="text-lg font-bold text-success">{isNewBest ? "New Personal Best! 🏆" : "You won!"}</p>
                                            <p className="text-3xl font-black game-text mt-1">{score} pts</p>
                                            <p className="text-sm text-foreground/50 mt-1">{moves} moves • {formatTime(time)}</p>
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                            <Button color="success" variant="flat" onPress={() => startGame()} startContent={<RotateCcw className="h-4 w-4" />}>Play Again</Button>
                                            <Button variant="flat" onPress={() => { setGameWon(false); setTab("leaderboard"); }} startContent={<Trophy className="h-4 w-4" />}>Leaderboard</Button>
                                        </div>
                                        {gameCount >= 3 && gameCount % 3 === 0 && <AdSlot format="banner" className="mt-2 rounded-lg overflow-hidden" />}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            ) : (
                <Leaderboard />
            )}
        </div>
    );
}
