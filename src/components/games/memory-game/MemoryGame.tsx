"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MemoryCard from "./MemoryCard";
import { MemoryGameLeaderboard } from "./MemoryGameLeaderboard";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { gameScoreService } from "@/src/lib/gameScoreService";
import { BannerAd, InterstitialAd, RewardedAd } from "@/src/components/ads";
import { useAdManager } from "@/src/lib/adService";

interface GameCard {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_SYMBOLS = [
  "🎮",
  "🏆",
  "⭐",
  "🎯",
  "🚀",
  "💎",
  "🔥",
  "⚡",
  "🎪",
  "🎨",
];

export default function MemoryGame() {
  const { user, playerUser } = useAuth();
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [shuffledPositions, setShuffledPositions] = useState<
    { x: number; y: number }[]
  >([]);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [showTopBanner, setShowTopBanner] = useState(true);
  const [showBottomBanner, setShowBottomBanner] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSavedScore = useRef(false);

  const { shouldShowAd, recordGameStart, recordAdShown } = useAdManager();

  // -------------------------------------------------
  // HIGH-SCORE LOGIC – no more blinking
  // -------------------------------------------------
  const [myHighScore, setMyHighScore] = useState<number | null>(null);
  const [isHighScoreLoading, setIsHighScoreLoading] = useState(true);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    const playerId = user?.uid || playerUser?.id;
    if (!playerId) return;

    setIsHighScoreLoading(true);
    gameScoreService
      .getPlayerHighScore(playerId, "memory-game")
      .then((best) => setMyHighScore(best ?? 0))
      .catch(() => setMyHighScore(0))
      .finally(() => setIsHighScoreLoading(false));
  }, [user?.uid, playerUser?.id]);

  // -------------------------------------------------
  // REST OF THE FILE UNCHANGED
  // -------------------------------------------------
  const handleRewardedAdComplete = (reward: string) => {
    // Hint functionality removed
    console.log(`Reward received: ${reward}`);
  };

  const generateShuffledPositions = () => {
    const positions = [];
    const gridSize = 5;
    const centerX = 2;
    const centerY = 2;
    for (let i = 0; i < 20; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const randomX = (col - centerX) * 80 + (Math.random() - 0.5) * 200;
      const randomY = (row - centerY) * 80 + (Math.random() - 0.5) * 200;
      positions.push({ x: randomX, y: randomY });
    }
    return positions;
  };

  const handleTopBannerClose = () => setShowTopBanner(false);
  const handleBottomBannerClose = () => setShowBottomBanner(false);

  const handleInterstitialAdClose = () => {
    setShowInterstitialAd(false);
    recordAdShown();
    setTimeout(() => initializeGameAfterAd(), 500);
  };

  const initializeGameAfterAd = () => {
    setIsShuffling(true);
    const positions = generateShuffledPositions();
    setShuffledPositions(positions);
    setTimeout(() => {
      const gameCards: GameCard[] = [];
      let id = 0;
      CARD_SYMBOLS.forEach((symbol) => {
        gameCards.push({
          id: id++,
          value: symbol,
          isFlipped: false,
          isMatched: false,
        });
        gameCards.push({
          id: id++,
          value: symbol,
          isFlipped: false,
          isMatched: false,
        });
      });
      for (let i = gameCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
      }
      setCards(gameCards);
      setFlippedCards([]);
      setMatchedPairs(0);
      setMoves(0);
      setGameStarted(false);
      setGameCompleted(false);
      setGameTime(0);
      stopTimer();
      setIsShuffling(false);
      setShuffledPositions([]);
      hasSavedScore.current = false;
      setIsNewHighScore(false);
    }, 1000);
  };

  const initializeGame = () => {
    setIsShuffling(true);
    recordGameStart();
    if (shouldShowAd(2)) {
      setShowInterstitialAd(true);
      return;
    }
    initializeGameAfterAd();
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
    else if (saved === "light") setDarkMode(false);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches)
      setDarkMode(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (darkMode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    const block = gameCompleted || isLeaderboardOpen || showInterstitialAd;
    document.body.style.overflow = block ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [gameCompleted, isLeaderboardOpen, showInterstitialAd]);

  const startTimer = () => {
    if (isTimerRunning) return;
    setIsTimerRunning(true);
    timerRef.current = setInterval(() => {
      setGameTime((prev) =>
        prev >= 999 ? (clearInterval(timerRef.current!), 999) : prev + 1
      );
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsTimerRunning(false);
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const handleCardClick = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
      startTimer();
    }
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2)
      return;
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))
    );
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);
      if (firstCard?.value === secondCard?.value) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.id) ? { ...c, isMatched: true } : c
            )
          );
          setMatchedPairs((p) => p + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (matchedPairs === CARD_SYMBOLS.length && gameStarted) {
      setGameCompleted(true);
      stopTimer();
    }
  }, [matchedPairs, gameStarted]);

  useEffect(() => {
    if (!gameCompleted || hasSavedScore.current) return;
    hasSavedScore.current = true;
    const saveScore = async () => {
      const playerId = user?.uid || playerUser?.id;
      if (!playerId) return;
      try {
        const score = Math.max(1000 - moves * 10 - gameTime, 100);
        await gameScoreService.saveScore(playerId, "memory-game", score, {
          playerName: user?.displayName || playerUser?.name || "Anonymous",
          moves,
          time: gameTime,
          completedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.error(e);
        toast.error("Failed to save score");
        hasSavedScore.current = false;
      }
    };
    saveScore();
  }, [gameCompleted, moves, gameTime, user, playerUser]);

  useEffect(() => {
    if (!gameCompleted) return;
    const fresh = Math.max(1000 - moves * 10 - gameTime, 100);
    if (fresh > (myHighScore ?? 0)) {
      setMyHighScore(fresh);
      setIsNewHighScore(true);
      setTimeout(() => setIsNewHighScore(false), 4000);
    }
  }, [gameCompleted, moves, gameTime, myHighScore]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 p-4 pt-0">
      <div className="w-full max-w-4xl">
        <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
          Match all the pairs to win!
        </p>
        {showTopBanner && (
          <div className="flex justify-center mt-4 w-full">
            <BannerAd
              adSlot="memory-game-top-banner"
              position="top"
              onAdClick={() => console.log("Top banner clicked")}
              onAdClose={handleTopBannerClose}
            />
          </div>
        )}
      </div>

      <div className="flex gap-4 sm:gap-6 mb-4 text-center">
        <div
          className={`
            relative bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm
            border border-gray-200 dark:border-gray-700
            ${
              isNewHighScore
                ? "animate-pulse ring-4 ring-yellow-400 dark:ring-yellow-300"
                : ""
            }
          `}
        >
          <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
            {myHighScore === null && isHighScoreLoading ? "…" : myHighScore}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            My Score
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {moves}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Moves
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {formatTime(gameTime)}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Time
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
            {matchedPairs}/{CARD_SYMBOLS.length}
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Pairs
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg relative overflow-hidden mb-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          <AnimatePresence>
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0, rotateY: -180 }}
                animate={{
                  scale: 1,
                  rotateY: 0,
                  x: isShuffling ? shuffledPositions[index]?.x || 0 : 0,
                  y: isShuffling ? shuffledPositions[index]?.y || 0 : 0,
                }}
                exit={{ scale: 0, rotateY: 180 }}
                transition={{
                  duration: isShuffling ? 1 : 0.3,
                  delay: isShuffling ? 0 : card.id * 0.02,
                  type: "spring",
                  stiffness: isShuffling ? 100 : 300,
                  damping: isShuffling ? 10 : 20,
                }}
                className="relative"
                style={{
                  transformStyle: "preserve-3d",
                  zIndex: isShuffling ? 10 : 1,
                }}
              >
                <MemoryCard
                  id={card.id}
                  value={card.value}
                  isFlipped={card.isFlipped || card.isMatched}
                  isMatched={card.isMatched}
                  onClick={handleCardClick}
                  disabled={
                    flippedCards.length >= 2 || gameCompleted || isShuffling
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={initializeGame}
          disabled={isShuffling}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isShuffling ? "Shuffling..." : "Reset"}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsLeaderboardOpen(true)}
          disabled={isShuffling}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🏆 Leaderboard
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 max-w-md mb-4"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          How to Play
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Click on cards to flip them over. Match all 10 pairs by remembering
          where each symbol is located. Try to complete the game in as few moves
          as possible!
        </p>
      </motion.div>

      {showBottomBanner && (
        <div className="flex justify-center mb-4 w-full">
          <BannerAd
            adSlot="memory-game-bottom-banner"
            position="bottom"
            onAdClick={() => console.log("Bottom banner clicked")}
            onAdClose={handleBottomBannerClose}
          />
        </div>
      )}

      <AnimatePresence>
        {gameCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center max-w-sm mx-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Congratulations!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                You completed the memory game in {moves} moves and{" "}
                {formatTime(gameTime)}!
                <br />
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  Final Score: {Math.max(1000 - moves * 10 - gameTime, 100)}
                </span>
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg shadow-md transition-colors"
              >
                Play Again
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLeaderboardOpen && (
        <MemoryGameLeaderboard
          gameId="memory-game"
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      <InterstitialAd
        isVisible={showInterstitialAd}
        onClose={handleInterstitialAdClose}
        onAdClick={() => console.log("Interstitial ad clicked")}
        autoClose
        autoCloseDelay={5}
      />
    </div>
  );
}
