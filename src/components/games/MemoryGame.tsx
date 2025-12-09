"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Trophy, Clock, RotateCcw, Zap, Star, Crown } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import confetti from "canvas-confetti";
import { GameLeaderboard } from "@/src/components/games/GameLeaderboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";

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
  "🚁", // Helicopter
  "🚙", // Jeep
  "🎒", // Backpack
  "💊", // Medkit
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
  // Safe access to player ID
  const playerId = user?.playerId || user?.player?.id;

  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    moves: 0,
    time: 0,
    score: 0,
    matchedPairs: 0,
  });
  const [gameState, setGameState] = useState<"idle" | "playing" | "won">(
    "idle"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [highScore, setHighScore] = useState<number | null>(null);
  const [isLoadingHighScore, setIsLoadingHighScore] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardUpdate, setLeaderboardUpdate] = useState(0);

  const [isRestarting, setIsRestarting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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
    setHasStarted(false);
  }, []);

  // Start game
  const startGame = () => {
    if (gameState === "playing" || gameState === "won") {
      setIsRestarting(true);
      setTimeout(() => {
        initializeGame();
        setGameState("playing");
        setIsRestarting(false);
      }, 600); // Small delay for visual feedback
    } else {
      initializeGame();
      setGameState("playing");
    }
  };

  // Fetch high score on mount
  useEffect(() => {
    const fetchHighScore = async () => {
      if (!playerId) {
        setIsLoadingHighScore(false);
        return;
      }
      try {
        const res = await fetch(`/api/games/memory?playerId=${playerId}`);
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
  }, [playerId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing" && !isRestarting && hasStarted) {
      interval = setInterval(() => {
        setGameStats((prev) => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, isRestarting, hasStarted]);

  // Check for game win
  useEffect(() => {
    if (
      gameStats.matchedPairs === CARD_ICONS.length &&
      gameState === "playing"
    ) {
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
    if (!playerId) return;

    try {
      const res = await fetch("/api/games/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, score }),
      });
      if (res.ok) {
        // Trigger leaderboard refresh
        setLeaderboardUpdate((prev) => prev + 1);

        const data = await res.json();
        if (data.isNewHighScore) {
          setHighScore(score);
          toast.success("🎉 New High Score!", {
            description: `You set a new record of ${score} points!`,
          });
        } else {
          toast.success("Score Saved!", {
            description: `You scored ${score} points. High score: ${data.highScore}`,
          });
        }
      } else {
        toast.error("Failed to save score");
      }
    } catch (error) {
      console.error("Error saving high score:", error);
      toast.error("Error saving score");
    }
  };

  // Handle card click
  const handleCardClick = (cardId: number) => {
    if (isProcessing || gameState !== "playing" || isRestarting) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId].isMatched) return;
    if (flippedCards.length >= 2) return;

    if (!hasStarted) setHasStarted(true);

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
      {/* Utility Bar - Reorganized */}
      <div className="flex items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border">
        {/* High Score Section */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              High Score
            </p>
            <p className="text-xl font-bold text-amber-500 tabular-nums leading-none">
              {isLoadingHighScore ? "..." : highScore ?? "-"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Dialog
            open={isLeaderboardOpen}
            onOpenChange={setIsLeaderboardOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Leaderboard</DialogTitle>
              </DialogHeader>
              <GameLeaderboard
                currentPlayerId={playerId}
                maxEntries={10}
                lastUpdated={leaderboardUpdate}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Game Board Section */}
      <Card className="overflow-hidden border-2 shadow-sm">
        <CardHeader className="border-b bg-muted/30 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Memory Match</CardTitle>
              <p className="text-sm text-muted-foreground">
                Find all matching pairs
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Game Stats - Moved inside */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 bg-muted/20 p-3 rounded-lg border border-border/50">
            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Time</span>
                <span className="font-mono font-bold text-lg leading-none">{formatTime(gameStats.time)}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Moves */}
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Moves</span>
                <span className="font-mono font-bold text-lg leading-none">{gameStats.moves}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Pairs */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Pairs</span>
                <span className="font-mono font-bold text-lg leading-none">{gameStats.matchedPairs}/{CARD_ICONS.length}</span>
              </div>
            </div>
          </div>

          {/* Game Grid */}
          <div className="grid grid-cols-6 gap-2 sm:gap-3 max-w-3xl mx-auto">
            {gameState === "idle" ? (
              <div className="col-span-6 flex flex-col items-center justify-center py-12 text-center bg-muted/10 rounded-xl border border-dashed">
                <div className="text-6xl mb-4 animate-bounce">🧠</div>
                <h3 className="text-xl font-bold mb-2">Ready to Play?</h3>
                <p className="text-muted-foreground mb-6 text-sm max-w-xs">
                  Match all pairs of cards as fast as you can with the fewest
                  moves!
                </p>
                <Button onClick={startGame} size="lg" className="gap-2 shadow-lg hover:shadow-primary/25 transition-all">
                  <Zap className="h-4 w-4" />
                  Start Game
                </Button>
              </div>
            ) : gameState === "won" ? (
              <div className="col-span-6 flex flex-col items-center justify-center py-10 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <div className="text-6xl mb-4 animate-pulse">🎉</div>
                <h3 className="text-2xl font-bold mb-2 text-emerald-600 dark:text-emerald-400">You Won!</h3>
                <div className="flex flex-col items-center gap-2 mb-6">
                  <Badge variant="secondary" className="text-lg px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    Score: {gameStats.score}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Completed in {formatTime(gameStats.time)} with {gameStats.moves} moves
                  </p>
                </div>
              </div>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className="aspect-square perspective-1000"
                  style={{ perspective: "1000px" }}
                >
                  <button
                    onClick={() => handleCardClick(card.id)}
                    disabled={isProcessing || card.isMatched || card.isFlipped || isRestarting}
                    className={`
                      w-full h-full relative preserve-3d transition-all duration-500
                      ${card.isFlipped || card.isMatched
                        ? "[transform:rotateY(180deg)]"
                        : ""
                      }
                      ${card.isMatched
                        ? "opacity-60 cursor-default grayscale-[0.2]"
                        : "cursor-pointer"
                      }
                      ${!card.isFlipped && !card.isMatched
                        ? "hover:scale-[1.02]"
                        : ""
                      }
                    `}
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* Front Face (Hidden initially) - contains Icon */}
                    <div
                      className={`
                        absolute inset-0 w-full h-full backface-hidden rounded-xl
                        flex items-center justify-center text-2xl sm:text-3xl font-bold
                        bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md
                        border border-white/10
                        ${card.isMatched ? "shadow-inner" : ""}
                      `}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {card.icon}
                    </div>

                    {/* Back Face (Visible initially) - contains Question Mark */}
                    <div
                      className={`
                        absolute inset-0 w-full h-full backface-hidden rounded-xl
                        flex items-center justify-center
                        bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800
                        border border-black/5 dark:border-white/10 shadow-sm
                        hover:shadow-md hover:from-white hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-700
                      `}
                      style={{
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <span className="text-slate-400 text-xl font-medium">?</span>
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Restart Button - Below Game */}
          {(gameState === "playing" || gameState === "won") && (
            <div className="flex justify-center pt-4 mt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="default"
                onClick={startGame}
                disabled={isRestarting}
                className="gap-2 w-full sm:w-auto min-w-[200px] border-primary/20 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all font-medium shadow-sm hover:shadow-md"
              >
                <RotateCcw className={`h-4 w-4 ${isRestarting ? 'animate-spin' : ''}`} />
                {isRestarting ? "Restarting..." : "Restart Game"}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
