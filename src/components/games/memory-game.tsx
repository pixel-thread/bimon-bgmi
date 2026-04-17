"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Tabs, Tab, Avatar, Skeleton } from "@heroui/react";
import { RotateCcw, Trophy, Timer, MousePointerClick, Gamepad2, Medal, Heart } from "lucide-react";
import { AdSlot } from "@/components/common/AdSlot";
import { CurrencyIcon } from "@/components/common/CurrencyIcon";

/* ── Config ────────────────────────────────────────────── */
const EMOJI_SETS = [
    ["🐶", "🐱", "🐼", "🦊", "🐸", "🦁", "🐯", "🐰", "🐻", "🐨", "🐵", "🦄"],
    ["🍕", "🍔", "🍟", "🌮", "🍩", "🍪", "🎂", "🍦", "🍫", "🍿", "☕", "🧃"],
    ["⚽", "🏀", "🎾", "🏐", "🎱", "🏓", "🎯", "🏆", "🎪", "🎨", "🎸", "🎲"],
    ["🚀", "✈️", "🚁", "🚂", "🏎️", "🚢", "🛸", "🎡", "🌋", "⛰️", "🌊", "🌈"],
];

const PAIRS = 10; // 5×4 grid — hard mode only
const COLS = "grid-cols-5";
const MAX_HEARTS = 5;
const HEART_REGEN_MS = 10 * 60 * 1000; // 10 minutes per heart

interface Card { id: number; emoji: string; isFlipped: boolean; isMatched: boolean; }

interface ServerScore {
    rank: number;
    score: number;
    moves: number;
    time: number;
    displayName: string;
    imageUrl: string | null;
    playerId: string;
}

/* ── Scoring: higher = better ────────────────────────── */
function calcScore(moves: number, time: number): number {
    return Math.max(0, 1000 - (moves * 10) - time);
}

/* ── Helpers ───────────────────────────────────────────── */
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

/* ── Hearts system ─────────────────────────────────────── */
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

/* ── Server Leaderboard ────────────────────────────────── */
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
    const hasRewards = Object.values(rewards).some(v => v > 0);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
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
        <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-lg bg-default-100 px-4 py-2 text-xs font-semibold text-foreground/50">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">Player</span>
                <span className="w-14 text-right">Score</span>
                <span className="w-12 text-right">Moves</span>
                <span className="w-12 text-right">Time</span>
                {hasRewards && <span className="w-12 text-right">Prize</span>}
            </div>
            {scores.map((entry) => (
                <div
                    key={entry.playerId}
                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${
                        entry.rank <= 3 ? "bg-amber-500/10" : "hover:bg-default-100"
                    }`}
                >
                    <span className={`w-8 text-center text-xs font-medium ${
                        entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-foreground/50" : entry.rank === 3 ? "text-orange-400" : "text-foreground/30"
                    }`}>
                        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                    </span>
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                        <Avatar src={entry.imageUrl || undefined} name={entry.displayName} size="sm" className="h-7 w-7 shrink-0" />
                        <span className="text-sm font-medium truncate">{entry.displayName}</span>
                    </div>
                    <span className="w-14 text-right text-sm font-bold game-text">{entry.score}</span>
                    <span className="w-12 text-right text-xs text-foreground/60">{entry.moves}</span>
                    <span className="w-12 text-right text-xs text-foreground/60">{formatTime(entry.time)}</span>
                    {hasRewards && (
                        <span className="w-12 text-right text-xs font-semibold text-success">
                            {rewards[entry.rank.toString()] ? (
                                <>{rewards[entry.rank.toString()]} <CurrencyIcon size={10} /></>
                            ) : ""}
                        </span>
                    )}
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
    const [moves, setMoves] = useState(0);
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [isNewBest, setIsNewBest] = useState(false);
    const [hearts, setHearts] = useState(MAX_HEARTS);
    const [showRefill, setShowRefill] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load hearts on mount + regen
    useEffect(() => {
        const saved = loadHearts();
        setHearts(getRegenedHearts(saved));
    }, []);

    // Timer
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRunning]);

    // Save score to server
    const saveScore = useCallback(async (m: number, t: number) => {
        const score = calcScore(m, t);
        try {
            const res = await fetch("/api/games/leaderboard", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score, moves: m, time: t }),
            });
            const data = await res.json();
            if (data.isNewBest) setIsNewBest(true);
            queryClient.invalidateQueries({ queryKey: ["game-leaderboard"] });
        } catch { /* fail silently */ }
    }, [queryClient]);

    // Start game
    const startGame = useCallback(() => {
        const saved = loadHearts();
        const current = getRegenedHearts(saved);

        if (current <= 0) {
            setShowRefill(true);
            setHearts(0);
            return;
        }

        const newHearts = current - 1;
        setHearts(newHearts);
        saveHearts(newHearts);

        setCards(createCards());
        setFlippedIds([]);
        setMoves(0);
        setTime(0);
        setIsRunning(false);
        setGameWon(false);
        setIsNewBest(false);
        setShowRefill(false);
        setTab("play");
    }, []);

    // Refill hearts
    function handleRefill() {
        setHearts(MAX_HEARTS);
        saveHearts(MAX_HEARTS);
        setShowRefill(false);
    }

    // Init on mount
    useEffect(() => { startGame(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Card click
    function handleCardClick(id: number) {
        if (flippedIds.length >= 2) return;
        const card = cards.find(c => c.id === id);
        if (!card || card.isFlipped || card.isMatched) return;
        if (!isRunning) setIsRunning(true);

        const newFlipped = [...flippedIds, id];
        setFlippedIds(newFlipped);
        setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [firstId, secondId] = newFlipped;
            const first = cards.find(c => c.id === firstId)!;
            const second = cards.find(c => c.id === secondId)!;

            if (first.emoji === second.emoji) {
                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
                    ));
                    setFlippedIds([]);
                    const remaining = cards.filter(c => !c.isMatched && c.id !== firstId && c.id !== secondId);
                    if (remaining.length === 0) {
                        setIsRunning(false);
                        setGameWon(true);
                        saveScore(moves + 1, time);
                    }
                }, 300);
            } else {
                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
                    ));
                    setFlippedIds([]);
                }, 800);
            }
        }
    }

    const score = calcScore(moves, time);

    return (
        <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 game-text" />
                        <h1 className="text-lg font-bold">Memory Game</h1>
                    </div>
                    <p className="text-sm text-foreground/50">Match all 10 pairs — fewest moves wins!</p>
                </div>
                <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                        <Heart
                            key={i}
                            className={`h-4 w-4 transition-all ${
                                i < hearts
                                    ? "text-red-500 fill-red-500 scale-100"
                                    : "text-foreground/15 scale-90"
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                selectedKey={tab}
                onSelectionChange={(key) => setTab(key as string)}
                variant="underlined"
                classNames={{ tabList: "w-full", tab: "flex-1" }}
                className="mb-4"
            >
                <Tab key="play" title={<div className="flex items-center gap-1.5"><Gamepad2 className="h-4 w-4" /><span>Play</span></div>} />
                <Tab key="leaderboard" title={<div className="flex items-center gap-1.5"><Trophy className="h-4 w-4" /><span>Leaderboard</span></div>} />
            </Tabs>

            {tab === "play" ? (
                <>
                    {showRefill ? (
                        <div className="flex flex-col items-center gap-4 rounded-xl bg-default-100 py-12 text-center">
                            <div className="flex gap-1">
                                {Array.from({ length: MAX_HEARTS }).map((_, i) => (
                                    <Heart key={i} className="h-6 w-6 text-foreground/15" />
                                ))}
                            </div>
                            <div>
                                <p className="font-medium text-foreground/60">Out of hearts!</p>
                                <p className="text-sm text-foreground/40">
                                    Hearts regenerate 1 every 10 minutes, or continue now
                                </p>
                            </div>
                            <Button
                                color="danger"
                                variant="flat"
                                onPress={handleRefill}
                                startContent={<Heart className="h-4 w-4 fill-current" />}
                            >
                                Refill Hearts
                            </Button>
                            <AdSlot format="banner" className="mt-2 w-full rounded-lg overflow-hidden" />
                        </div>
                    ) : (
                        <>
                            {/* Stats bar */}
                            <div className="mb-4 flex items-center justify-between rounded-lg bg-default-100 px-4 py-2.5">
                                <div className="flex items-center gap-1.5 text-sm">
                                    <MousePointerClick className="h-4 w-4 text-foreground/40" />
                                    <span className="font-semibold">{moves}</span>
                                </div>
                                <div className="text-sm font-bold game-text">
                                    {score} pts
                                </div>
                                <div className="flex items-center gap-1.5 text-sm">
                                    <Timer className="h-4 w-4 text-foreground/40" />
                                    <span className="font-semibold">{formatTime(time)}</span>
                                </div>
                                <Button size="sm" variant="light" isIconOnly onPress={() => startGame()} aria-label="Restart">
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Card grid - always 5×4 */}
                            <div className={`grid ${COLS} gap-2`}>
                                {cards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => handleCardClick(card.id)}
                                        disabled={card.isMatched || card.isFlipped}
                                        className={`
                                            aspect-square rounded-xl text-2xl sm:text-3xl font-bold
                                            transition-all duration-300 transform
                                            ${card.isMatched
                                                ? "scale-90 opacity-40 bg-success/20 border-2 border-success/30"
                                                : card.isFlipped
                                                    ? "scale-105 bg-primary/20 border-2 border-primary/40 shadow-lg"
                                                    : "bg-default-100 hover:bg-default-200 active:scale-95 border-2 border-transparent cursor-pointer"
                                            }
                                        `}
                                    >
                                        <span className={`transition-all duration-200 ${
                                            card.isFlipped || card.isMatched ? "opacity-100 scale-100" : "opacity-0 scale-50"
                                        }`}>
                                            {card.emoji}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Win */}
                            {gameWon && (
                                <div className="mt-6 rounded-xl bg-success/10 border border-success/20 p-6 text-center space-y-3">
                                    <div className="text-4xl">🎉</div>
                                    <div>
                                        <p className="text-lg font-bold text-success">
                                            {isNewBest ? "New Best! 🏆" : "You won!"}
                                        </p>
                                        <p className="text-2xl font-black game-text">{score} pts</p>
                                        <p className="text-sm text-foreground/60">
                                            {moves} moves • {formatTime(time)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <Button color="success" variant="flat" onPress={() => startGame()} startContent={<RotateCcw className="h-4 w-4" />}>
                                            Play Again
                                        </Button>
                                        <Button variant="flat" onPress={() => setTab("leaderboard")} startContent={<Trophy className="h-4 w-4" />}>
                                            Scores
                                        </Button>
                                    </div>
                                    <AdSlot format="banner" className="mt-4 rounded-lg overflow-hidden" />
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
