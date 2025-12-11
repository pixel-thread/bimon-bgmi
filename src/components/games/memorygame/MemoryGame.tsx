"use client";

import { useState, useEffect, useCallback, lazy, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Trophy, Clock, RotateCcw, Zap, Star, Crown, Brain, Volume2, VolumeX, RefreshCcw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";

// Hooks
import { useGameSounds } from "./hooks/useGameSounds";
import { useGameAnalytics } from "./hooks/useGameAnalytics";

// Components
import { ProgressBarSkeleton, LeaderboardSkeleton } from "./ProgressBarSkeleton";
import { ShareScoreButton } from "./ShareScoreButton";
import { ParticleEffect } from "./ParticleEffect";

// Types & Constants
import type { CardType, GameStats, GameState } from "./types";
import { CARD_ICONS, GAME_CONFIG, SCORE_CONFIG, STORAGE_KEYS } from "./constants";

// Lazy load leaderboard
const GameLeaderboard = lazy(() =>
  import("./GameLeaderboard").then(mod => ({ default: mod.GameLeaderboard }))
);

export function MemoryGame() {
  const { user } = useAuth();
  const playerId = user?.playerId;

  // Core game state
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    moves: 0,
    time: 0,
    score: 0,
    matchedPairs: 0,
  });
  const [gameState, setGameState] = useState<GameState>("idle");
  const [isProcessing, setIsProcessing] = useState(false);

  // Scores
  const [highScore, setHighScore] = useState<number | null>(null);
  const [topScore, setTopScore] = useState<number | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<Array<{
    rank: number;
    playerId: string;
    playerName: string;
    highScore: number;
    lastPlayedAt: string;
  }>>([]);

  // UI state
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [leaderboardUpdate, setLeaderboardUpdate] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [particleTrigger, setParticleTrigger] = useState(0);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });

  // Loading & Error state
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Refs
  const lastMatchRef = useRef<boolean>(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { isMuted, toggleMute, playSound } = useGameSounds();
  const { trackGameStart, trackGameComplete } = useGameAnalytics();

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
    setGameState("playing");
    setIsProcessing(false);
    setHasStarted(false);
    setComboCount(0);
    lastMatchRef.current = false;
  }, []);

  // Start game with shuffle animation
  const startGame = useCallback(() => {
    const totalCards = CARD_ICONS.length * 2;

    if (gameState === "playing" || gameState === "won") {
      setIsRestarting(true);

      // Step 1: First hide all revealed cards (flip them back)
      setCards(prev => prev.map(card => ({
        ...card,
        isFlipped: false,
        isMatched: false,
      })));

      // Step 2: Start shuffle animation after cards are hidden
      setTimeout(() => {
        setIsShuffling(true);

        // Multiple shuffle steps for visual effect
        let step = 0;
        const shuffleInterval = setInterval(() => {
          const randomOrder = Array.from({ length: totalCards }, (_, i) => i)
            .sort(() => Math.random() - 0.5);
          setShuffleOrder(randomOrder);
          step++;

          if (step >= 5) {
            clearInterval(shuffleInterval);
            setTimeout(() => {
              initializeGame();
              setShuffleOrder([]);
              setGameState("playing");
              setIsRestarting(false);
              setIsShuffling(false);
              trackGameStart();
            }, 200);
          }
        }, 250);
      }, 500); // Wait for cards to flip back
    } else {
      // First game start - quick shuffle animation
      setIsShuffling(true);

      let step = 0;
      const shuffleInterval = setInterval(() => {
        const randomOrder = Array.from({ length: totalCards }, (_, i) => i)
          .sort(() => Math.random() - 0.5);
        setShuffleOrder(randomOrder);
        step++;

        if (step >= 3) {
          clearInterval(shuffleInterval);
          setTimeout(() => {
            initializeGame();
            setShuffleOrder([]);
            setGameState("playing");
            setIsShuffling(false);
            trackGameStart();
          }, 200);
        }
      }, 250);
    }
  }, [gameState, initializeGame, trackGameStart]);

  // Fetch scores with offline fallback
  const fetchScores = useCallback(async () => {
    setIsLoadingScores(true);
    setHasError(false);

    // Try cached scores first
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_CACHE);
      if (cached) {
        const { highScore: cachedHigh, topScore: cachedTop } = JSON.parse(cached);
        if (cachedHigh) setHighScore(cachedHigh);
        if (cachedTop) setTopScore(cachedTop);
      }
    } catch { /* ignore */ }

    // Fetch user's high score
    if (playerId) {
      try {
        const res = await fetch(`/api/games/memory?playerId=${playerId}`);
        if (res.ok) {
          const data = await res.json();
          setHighScore(data.highScore);
        }
      } catch (error) {
        console.error("Error fetching high score:", error);
      }
    }

    // Fetch leaderboard (stores full data to avoid duplicate fetches)
    try {
      const res = await fetch("/api/admin/games");
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard?.length > 0) {
          setLeaderboardData(data.leaderboard);
          setTopScore(data.leaderboard[0].highScore);
        }
      } else {
        throw new Error("Failed to fetch");
      }
    } catch {
      setHasError(true);
    }

    // Cache scores
    try {
      localStorage.setItem(STORAGE_KEYS.HIGH_SCORE_CACHE, JSON.stringify({
        highScore,
        topScore,
        cachedAt: Date.now(),
      }));
    } catch { /* ignore */ }

    setIsLoadingScores(false);
  }, [playerId, highScore, topScore]);

  // Initialize and fetch on mount
  useEffect(() => {
    initializeGame();
    fetchScores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when leaderboard updates
  useEffect(() => {
    if (leaderboardUpdate > 0) {
      fetchScores();
    }
  }, [leaderboardUpdate, fetchScores]);

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

  // Save high score
  const saveHighScore = useCallback(async (score: number) => {
    if (!playerId) return;

    try {
      const res = await fetch("/api/games/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, score }),
      });
      if (res.ok) {
        setLeaderboardUpdate((prev) => prev + 1);
        const data = await res.json();
        if (data.isNewHighScore) {
          setHighScore(score);
          toast.success("🎉 New High Score!", {
            description: `You set a new record of ${score} points!`,
          });
        } else {
          toast.success("Score Saved!", {
            description: `You scored ${score} points.`,
          });
        }
        return data.isNewHighScore;
      }
    } catch (error) {
      console.error("Error saving score:", error);
      // Cache for offline sync
      try {
        const offlineScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_SCORES) || "[]");
        offlineScores.push({ playerId, score, timestamp: Date.now() });
        localStorage.setItem(STORAGE_KEYS.OFFLINE_SCORES, JSON.stringify(offlineScores));
      } catch { /* ignore */ }
      toast.error("Saved offline - will sync later");
    }
    return false;
  }, [playerId]);

  // Check for game win
  useEffect(() => {
    if (gameStats.matchedPairs === CARD_ICONS.length && gameState === "playing") {
      setGameState("won");

      const timeBonus = Math.max(0, SCORE_CONFIG.TIME_BONUS_MAX - gameStats.time * SCORE_CONFIG.TIME_PENALTY_PER_SECOND);
      const moveBonus = Math.max(0, SCORE_CONFIG.MOVE_BONUS_MAX - gameStats.moves * SCORE_CONFIG.MOVE_PENALTY_PER_MOVE);
      const finalScore = SCORE_CONFIG.BASE_SCORE + timeBonus + moveBonus;

      setGameStats((prev) => ({ ...prev, score: finalScore }));
      trackGameComplete(finalScore, gameStats.time);

      // Check if new high score for confetti variation
      const isNewHighScore = !highScore || finalScore > highScore;

      if (isNewHighScore) {
        playSound("highscore");
        // Elaborate confetti for high score
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ["#fbbf24", "#f59e0b", "#eab308", "#facc15"];

        (function frame() {
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors,
          });
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors,
          });
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        })();
      } else {
        playSound("win");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      saveHighScore(finalScore);
    }
  }, [gameStats.matchedPairs, gameState, gameStats.time, gameStats.moves, highScore, playSound, saveHighScore, trackGameComplete]);

  // Handle card click
  const handleCardClick = useCallback((cardId: number, event?: React.MouseEvent | React.KeyboardEvent) => {
    if (isProcessing || gameState !== "playing" || isRestarting) return;
    if (flippedCards.includes(cardId)) return;
    if (cards[cardId]?.isMatched) return;
    if (flippedCards.length >= 2) return;

    if (!hasStarted) setHasStarted(true);

    playSound("flip");

    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );
    setFlippedCards((prev) => [...prev, cardId]);

    // Store position for particle effect
    if (event && "currentTarget" in event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = gameContainerRef.current?.getBoundingClientRect();
      if (containerRect) {
        setParticlePosition({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height / 2,
        });
      }
    }
  }, [isProcessing, gameState, isRestarting, flippedCards, cards, hasStarted, playSound]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((cardId: number, event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleCardClick(cardId, event);
    }
  }, [handleCardClick]);

  // Check for match
  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsProcessing(true);
      setGameStats((prev) => ({ ...prev, moves: prev.moves + 1 }));

      const [first, second] = flippedCards;
      if (cards[first].icon === cards[second].icon) {
        // Match found
        if (lastMatchRef.current) {
          setComboCount((prev) => prev + 1);
        } else {
          setComboCount(1);
        }
        lastMatchRef.current = true;
        playSound("match");
        setParticleTrigger((prev) => prev + 1);

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
        }, GAME_CONFIG.MATCH_DELAY);
      } else {
        // No match
        lastMatchRef.current = false;
        setComboCount(0);
        playSound("mismatch");

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
        }, GAME_CONFIG.MISMATCH_DELAY);
      }
    }
  }, [flippedCards, cards, playSound]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Computed values
  // Timer warning removed - no longer showing red after 60 seconds
  const isTopScorer = !!(highScore && topScore && highScore >= topScore);
  const progressPercentage = topScore && highScore
    ? Math.min((highScore / topScore) * 100, 100)
    : 0;

  return (
    <div className="space-y-6" ref={gameContainerRef}>
      {/* Title - Centered */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="p-3 bg-primary/10 rounded-2xl mb-2">
          <Brain className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold">Memory Match</h2>
        <p className="text-sm text-muted-foreground">
          Find all matching pairs
        </p>
      </div>

      {/* Utility Bar with Progress */}
      <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl border">
        {/* Progress Bar Section */}
        {isLoadingScores ? (
          <ProgressBarSkeleton />
        ) : (
          <div className="flex-1 flex items-center gap-3">
            {/* User's High Score (Left) */}
            <div className="flex items-center gap-1 shrink-0">
              {isTopScorer ? (
                <Crown className="h-3.5 w-3.5 text-amber-500 animate-pulse" aria-hidden="true" />
              ) : (
                <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              )}
              <span className="text-xs font-bold tabular-nums" aria-label={`Your high score: ${highScore ?? 0}`}>
                {highScore ?? 0}
              </span>
              {isTopScorer && (
                <span className="text-[10px] font-bold text-emerald-500 ml-0.5">#1</span>
              )}
            </div>

            {/* Progress Bar */}
            <div
              className={`flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ${isTopScorer ? "ring-2 ring-emerald-400/50 ring-offset-1" : ""
                }`}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Score progress towards top score"
            >
              <div
                className={`h-full transition-all duration-500 ease-out rounded-full ${isTopScorer
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                  : "bg-gradient-to-r from-amber-400 to-amber-500"
                  }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Top Score (Right) */}
            <div className="flex items-center gap-1 shrink-0">
              <Crown className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              <span className="text-xs font-bold tabular-nums" aria-label={`Top score: ${topScore ?? "-"}`}>
                {topScore ?? "-"}
              </span>
            </div>
          </div>
        )}

        {/* Error retry */}
        {hasError && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchScores}
            className="gap-1 text-amber-500 hover:text-amber-600"
            aria-label="Retry loading scores"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Retry</span>
          </Button>
        )}

        {/* Mute Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="h-9 w-9 shrink-0"
          aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        {/* Leaderboard Button */}
        <Dialog open={isLeaderboardOpen} onOpenChange={setIsLeaderboardOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 h-9 shrink-0"
              aria-label="Open leaderboard"
            >
              <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md !flex !flex-col max-h-[85vh] overflow-hidden">
            <DialogHeader className="flex-shrink-0 pb-2">
              <DialogTitle>Leaderboard</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 min-h-0 -mx-8 px-8 pb-2 max-h-[calc(85vh-100px)] overscroll-contain scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              <Suspense fallback={<LeaderboardSkeleton />}>
                <GameLeaderboard
                  currentPlayerId={playerId ?? undefined}
                  maxEntries={10}
                  lastUpdated={leaderboardUpdate}
                  preloadedData={leaderboardData.length > 0 ? leaderboardData : undefined}
                />
              </Suspense>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Game Board Section */}
      <Card className="overflow-hidden border-2 shadow-sm relative">
        {/* Particle Effect Layer */}
        <ParticleEffect
          trigger={particleTrigger}
          x={particlePosition.x}
          y={particlePosition.y}
        />

        {/* Combo indicator */}
        {comboCount > 1 && gameState === "playing" && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className="animate-bounce">
              🔥 {comboCount}x Combo!
            </Badge>
          </div>
        )}

        <CardContent className="p-4 sm:p-6 space-y-6">
          {/* Game Stats */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 bg-muted/20 p-3 rounded-lg border border-border/50">
            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Time</span>
                <span className="font-mono font-bold text-lg leading-none">
                  {formatTime(gameStats.time)}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-border" aria-hidden="true" />

            {/* Moves */}
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Moves</span>
                <span className="font-mono font-bold text-lg leading-none">{gameStats.moves}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-border" aria-hidden="true" />

            {/* Pairs */}
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none">Pairs</span>
                <span className="font-mono font-bold text-lg leading-none">
                  {gameStats.matchedPairs}/{CARD_ICONS.length}
                </span>
              </div>
            </div>
          </div>

          {/* Game Grid */}
          <div
            className="grid grid-cols-6 gap-2 sm:gap-3 max-w-3xl mx-auto"
            role="grid"
            aria-label="Memory game board"
          >
            {gameState === "won" ? (
              <div className="col-span-6 flex flex-col items-center justify-center py-10 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <div className="text-6xl mb-4 animate-pulse" aria-hidden="true">🎉</div>
                <h3 className="text-2xl font-bold mb-2 text-emerald-600 dark:text-emerald-400">
                  You Won!
                </h3>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-lg px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    Score: {gameStats.score}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Completed in {formatTime(gameStats.time)} with {gameStats.moves} moves
                  </p>
                </div>
                <div className="flex gap-2">
                  <ShareScoreButton
                    score={gameStats.score}
                    time={formatTime(gameStats.time)}
                    moves={gameStats.moves}
                  />
                  <Button onClick={startGame} className="gap-2">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Play Again
                  </Button>
                </div>
              </div>
            ) : (
              cards.map((card, index) => {
                // Get shuffled order
                const order = shuffleOrder.length > 0 ? shuffleOrder.indexOf(index) : index;

                return (
                  <motion.div
                    key={card.id}
                    layout
                    layoutId={`card-${card.id}`}
                    initial={false}
                    animate={{
                      scale: isShuffling ? [1, 0.95, 1.05, 1] : 1,
                      rotate: isShuffling ? [0, -3, 3, 0] : 0,
                    }}
                    transition={{
                      layout: { type: "spring", stiffness: 150, damping: 20 },
                      scale: { duration: 0.2 },
                      rotate: { duration: 0.2 },
                    }}
                    className="aspect-square"
                    style={{
                      perspective: "1000px",
                      order: order,
                    }}
                    role="gridcell"
                  >
                    <button
                      onClick={(e) => handleCardClick(card.id, e)}
                      onKeyDown={(e) => handleKeyDown(card.id, e)}
                      disabled={isProcessing || card.isMatched || card.isFlipped || isRestarting}
                      aria-label={card.isFlipped || card.isMatched ? `Card showing ${card.icon}` : "Hidden card"}
                      aria-pressed={card.isFlipped}
                      className={`
                      w-full h-full relative preserve-3d transition-all duration-500
                      ${card.isFlipped || card.isMatched ? "[transform:rotateY(180deg)]" : ""}
                      ${card.isMatched ? "cursor-default ring-2 ring-emerald-500 ring-offset-2 rounded-xl" : "cursor-pointer"}
                      ${!card.isFlipped && !card.isMatched ? "hover:scale-[1.02] focus:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" : ""}
                    `}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Front Face - The icon side */}
                      <div
                        className={`
                        absolute inset-0 w-full h-full backface-hidden rounded-xl
                        flex items-center justify-center text-2xl sm:text-3xl font-bold
                        ${card.isMatched
                            ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"
                          }
                        border border-white/10
                      `}
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      >
                        {card.icon}
                      </div>

                      {/* Back Face */}
                      <div
                        className="absolute inset-0 w-full h-full backface-hidden rounded-xl
                        flex items-center justify-center
                        bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800
                        border border-black/5 dark:border-white/10 shadow-sm
                        hover:shadow-md hover:from-white hover:to-slate-100 dark:hover:from-slate-600 dark:hover:to-slate-700"
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <span className="text-slate-400 text-xl font-medium">?</span>
                      </div>
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Restart Button */}
          {(gameState === "playing" || gameState === "won") && (
            <div className="flex justify-center pt-4 mt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="default"
                onClick={startGame}
                disabled={isRestarting}
                className="gap-2 w-full sm:w-auto min-w-[200px] border-primary/20 hover:bg-primary/5 hover:border-primary/50 hover:text-primary transition-all font-medium shadow-sm hover:shadow-md"
                aria-label={isRestarting ? "Restarting game" : "Restart game"}
              >
                <RotateCcw className={`h-4 w-4 ${isRestarting ? "animate-spin" : ""}`} aria-hidden="true" />
                {isRestarting ? "Restarting..." : "Restart Game"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
