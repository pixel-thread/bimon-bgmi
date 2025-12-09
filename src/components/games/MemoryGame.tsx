"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Trophy, Clock, RotateCcw, Zap, Star, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import confetti from "canvas-confetti";

// BGMI-themed card icons
const CARD_ICONS = [
    "🎯", // Target
    "🔫", // Gun
    "💣", // Bomb
    "🪖", // Helmet
    "🎮", // Controller
    "🏆", // Trophy
    "⚡", // Energy
    "🛡️", // Shield
];

interface CardType {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
}

interface GameStats {
    moves: number;
    time: number;
    score: number;
    matchedPairs: number;
}

export function MemoryGame() {
    const { user } = useAuth();
    const [cards, setCards] = useState<CardType[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [gameStats, setGameStats] = useState<GameStats>({
        moves: 0,
        time: 0,
        score: 0,
        matchedPairs: 0,
    });
    const [gameState, setGameState] = useState<"idle" | "playing" | "won">("idle");
    const [isProcessing, setIsProcessing] = useState(false);
    const [highScore, setHighScore] = useState<number | null>(null);
    const [isLoadingHighScore, setIsLoadingHighScore] = useState(true);

    // Initialize cards
    const initializeGame = useCallback(() => {
        const shuffledIcons = [...CARD_ICONS, ...CARD_ICONS]
            .sort(() => Math.random() - 0.5)
            .map((icon, index) => ({
                id: index,
                icon,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(shuffledIcons);
        setFlippedCards([]);
        setGameStats({ moves: 0, time: 0, score: 0, matchedPairs: 0 });
        setGameState("idle");
        setIsProcessing(false);
    }, []);

    // Start game
    const startGame = () => {
        initializeGame();
        setGameState("playing");
    };

    // Fetch high score on mount
    useEffect(() => {
        const fetchHighScore = async () => {
            if (!user?.playerId) {
                setIsLoadingHighScore(false);
                return;
            }
            try {
                const res = await fetch(`/api/games/memory?playerId=${user.playerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setHighScore(data.highScore);
                }
            } catch (error) {
                console.error("Error fetching high score:", error);
            } finally {
                setIsLoadingHighScore(false);
            }
        };
        fetchHighScore();
    }, [user?.playerId]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState === "playing") {
            interval = setInterval(() => {
                setGameStats((prev) => ({ ...prev, time: prev.time + 1 }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Check for game win
    useEffect(() => {
        if (gameStats.matchedPairs === CARD_ICONS.length && gameState === "playing") {
            setGameState("won");
            // Calculate final score
            const timeBonus = Math.max(0, 1000 - gameStats.time * 10);
            const moveBonus = Math.max(0, 500 - gameStats.moves * 20);
            const finalScore = 1000 + timeBonus + moveBonus;
            setGameStats((prev) => ({ ...prev, score: finalScore }));

            // Trigger confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });

            // Save high score
            saveHighScore(finalScore);
        }
    }, [gameStats.matchedPairs, gameState, gameStats.time, gameStats.moves]);

    // Save high score
    const saveHighScore = async (score: number) => {
        if (!user?.playerId) return;

        try {
            const res = await fetch("/api/games/memory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ playerId: user.playerId, score }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.isNewHighScore) {
                    setHighScore(score);
                    toast.success("🎉 New High Score!", {
                        description: `You scored ${score} points!`,
                    });
                }
            }
        } catch (error) {
            console.error("Error saving high score:", error);
        }
    };

    // Handle card click
    const handleCardClick = (cardId: number) => {
        if (isProcessing || gameState !== "playing") return;
        if (flippedCards.includes(cardId)) return;
        if (cards[cardId].isMatched) return;
        if (flippedCards.length >= 2) return;

        // Flip the card
        setCards((prev) =>
            prev.map((card) =>
                card.id === cardId ? { ...card, isFlipped: true } : card
            )
        );
        setFlippedCards((prev) => [...prev, cardId]);
    };

    // Check for match when two cards are flipped
    useEffect(() => {
        if (flippedCards.length === 2) {
            setIsProcessing(true);
            setGameStats((prev) => ({ ...prev, moves: prev.moves + 1 }));

            const [first, second] = flippedCards;
            if (cards[first].icon === cards[second].icon) {
                // Match found
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((card) =>
                            card.id === first || card.id === second
                                ? { ...card, isMatched: true }
                                : card
                        )
                    );
                    setGameStats((prev) => ({
                        ...prev,
                        matchedPairs: prev.matchedPairs + 1,
                    }));
                    setFlippedCards([]);
                    setIsProcessing(false);
                }, 500);
            } else {
                // No match - flip back
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((card) =>
                            card.id === first || card.id === second
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    );
                    setFlippedCards([]);
                    setIsProcessing(false);
                }, 1000);
            }
        }
    }, [flippedCards, cards]);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // Initialize on mount
    useEffect(() => {
        initializeGame();
    }, [initializeGame]);

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-3 flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                            <Zap className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Moves</p>
                            <p className="text-lg font-bold text-blue-500">{gameStats.moves}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-3 flex items-center gap-2">
                        <div className="p-1.5 bg-purple-500/20 rounded-lg">
                            <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Time</p>
                            <p className="text-lg font-bold text-purple-500">
                                {formatTime(gameStats.time)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-3 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                            <Star className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">Pairs</p>
                            <p className="text-lg font-bold text-emerald-500">
                                {gameStats.matchedPairs}/{CARD_ICONS.length}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="p-3 flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500/20 rounded-lg">
                            <Crown className="h-4 w-4 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">High Score</p>
                            <p className="text-lg font-bold text-amber-500">
                                {isLoadingHighScore ? "..." : highScore ?? "-"}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Game Board */}
            <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                <Trophy className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Memory Match</CardTitle>
                                <p className="text-[10px] text-muted-foreground">
                                    Find all matching pairs
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={startGame}
                            className="gap-1.5"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            {gameState === "idle" ? "Start" : "Restart"}
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                    {gameState === "idle" ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="text-6xl mb-4">🧠</div>
                            <h3 className="text-xl font-bold mb-2">Ready to Play?</h3>
                            <p className="text-muted-foreground mb-4 text-sm max-w-xs">
                                Match all pairs of cards as fast as you can with the fewest moves!
                            </p>
                            <Button onClick={startGame} size="lg" className="gap-2">
                                <Zap className="h-4 w-4" />
                                Start Game
                            </Button>
                        </div>
                    ) : gameState === "won" ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="text-6xl mb-4">🎉</div>
                            <h3 className="text-2xl font-bold mb-2">You Won!</h3>
                            <div className="space-y-2 mb-6">
                                <Badge variant="secondary" className="text-lg px-4 py-1">
                                    Score: {gameStats.score}
                                </Badge>
                                <div className="flex gap-4 justify-center text-sm text-muted-foreground">
                                    <span>Moves: {gameStats.moves}</span>
                                    <span>Time: {formatTime(gameStats.time)}</span>
                                </div>
                            </div>
                            <Button onClick={startGame} size="lg" className="gap-2">
                                <RotateCcw className="h-4 w-4" />
                                Play Again
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
                            {cards.map((card) => (
                                <button
                                    key={card.id}
                                    onClick={() => handleCardClick(card.id)}
                                    disabled={isProcessing || card.isMatched || card.isFlipped}
                                    className={`
                    aspect-square rounded-xl text-2xl sm:text-3xl font-bold
                    transition-all duration-300 transform
                    ${card.isFlipped || card.isMatched
                                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rotate-0 scale-100"
                                            : "bg-gradient-to-br from-slate-700 to-slate-800 text-transparent hover:from-slate-600 hover:to-slate-700 hover:scale-105"
                                        }
                    ${card.isMatched ? "opacity-60 cursor-default" : "cursor-pointer"}
                    ${!card.isFlipped && !card.isMatched ? "shadow-lg hover:shadow-xl" : ""}
                    border border-white/10
                  `}
                                    style={{
                                        perspective: "1000px",
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    <span
                                        className={`
                      transition-all duration-300
                      ${card.isFlipped || card.isMatched ? "scale-100" : "scale-0"}
                    `}
                                    >
                                        {card.icon}
                                    </span>
                                    {!card.isFlipped && !card.isMatched && (
                                        <span className="absolute inset-0 flex items-center justify-center text-slate-500 text-xl">
                                            ?
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
