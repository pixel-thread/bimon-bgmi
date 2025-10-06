"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { gameScoreService } from "@/src/lib/gameScoreService";
import LeaderboardModal from "./LeaderboardModal";
import InterstitialAd from "@/src/components/ads/InterstitialAd";

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_FOOD = { x: 15, y: 15 };
const MAX_LIVES = 5;
const LIFE_REGENERATION_TIME = 30 * 60 * 1000; // 30 min
const LIVES_STORAGE_KEY = "snake_game_lives";
const LAST_LIFE_LOSS_KEY = "snake_game_last_life_loss";

export default function SnakeGame({
  onGameOver,
  disableAds = false,
}: {
  onGameOver?: (finalScore: number) => void;
  disableAds?: boolean;
}) {
  const { user, playerUser } = useAuth();
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [lastLifeLoss, setLastLifeLoss] = useState<number | null>(null);
  const [showLifeLost, setShowLifeLost] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMilestoneAd, setShowMilestoneAd] = useState(false);
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [lastAdTime, setLastAdTime] = useState<number | null>(null);

  // Use refs for values that need to be accessed in intervals but don't need re-renders
  const currentDirection = useRef(INITIAL_DIRECTION);
  const nextDirection = useRef(INITIAL_DIRECTION);
  const gameStateRef = useRef({
    isPlaying: false,
    gameOver: false,
    showLifeLost: false,
  });
  const lastMoveTime = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);

  // Update refs when state changes
  useEffect(() => {
    currentDirection.current = direction;
    nextDirection.current = direction;
  }, [direction]);

  useEffect(() => {
    gameStateRef.current = { isPlaying, gameOver, showLifeLost };
  }, [isPlaying, gameOver, showLifeLost]);

  const generateFood = useCallback(() => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  /* ----------  life / storage  ---------- */
  useEffect(() => {
    const savedLives = localStorage.getItem(LIVES_STORAGE_KEY);
    const savedLast = localStorage.getItem(LAST_LIFE_LOSS_KEY);
    if (savedLives) setLives(parseInt(savedLives, 10));
    else setLives(MAX_LIVES);
    if (savedLast) setLastLifeLoss(parseInt(savedLast, 10));
  }, []);

  useEffect(() => {
    if (lives >= MAX_LIVES || !lastLifeLoss) return;
    const now = Date.now();
    const since = now - lastLifeLoss;
    if (since < LIFE_REGENERATION_TIME) {
      const t = setTimeout(() => {
        setLives((p) => {
          const n = Math.min(p + 1, MAX_LIVES);
          localStorage.setItem(LIVES_STORAGE_KEY, n.toString());
          return n;
        });
        setLastLifeLoss(now);
      }, LIFE_REGENERATION_TIME - since);
      return () => clearTimeout(t);
    } else {
      const gain = Math.min(
        Math.floor(since / LIFE_REGENERATION_TIME),
        MAX_LIVES - lives
      );
      if (gain > 0) {
        setLives((p) => {
          const n = Math.min(p + gain, MAX_LIVES);
          localStorage.setItem(LIVES_STORAGE_KEY, n.toString());
          return n;
        });
      }
      if (lives + gain < MAX_LIVES)
        setLastLifeLoss(now - (since % LIFE_REGENERATION_TIME));
      else setLastLifeLoss(null);
    }
  }, [lives, lastLifeLoss]);

  /* ----------  optimized game loop with RAF  ---------- */
  const moveSnake = useCallback(() => {
    const { isPlaying, gameOver, showLifeLost } = gameStateRef.current;
    if (!isPlaying || gameOver || showLifeLost) return;

    const now = performance.now();
    if (now - lastMoveTime.current < 120) return; // Faster: 120ms instead of 150ms

    lastMoveTime.current = now;

    // Apply queued direction change
    if (nextDirection.current !== currentDirection.current) {
      currentDirection.current = nextDirection.current;
      setDirection(currentDirection.current);
    }

    setSnake((curr) => {
      const copy = [...curr];
      const head = {
        x: copy[0].x + currentDirection.current.x,
        y: copy[0].y + currentDirection.current.y,
      };

      // Check boundaries FIRST
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        loseLife();
        return curr; // Don't move the snake
      }

      // Check self-collision by comparing with BODY segments only (exclude head)
      if (
        copy
          .slice(1)
          .some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        loseLife();
        return curr; // Don't move the snake
      }

      // No collision - proceed with movement
      copy.unshift(head);

      // Check food collision with current food position
      const currentFood = food; // Capture current food position
      if (head.x === currentFood.x && head.y === currentFood.y) {
        // Food eaten - update score and generate new food
        setScore((p) => {
          const ns = p + 10;
          if (ns > highScore) setHighScore(ns);

          // Show milestone ad at certain scores
          if (ns === 50 || ns === 100 || ns === 150 || ns === 200) {
            const now = Date.now();
            if (
              !disableAds &&
              (!lastAdTime || now - lastAdTime > 2 * 60 * 1000)
            ) {
              setTimeout(() => {
                setShowMilestoneAd(true);
                setMilestoneCount((prev) => prev + 1);
                setLastAdTime(now);
              }, 1000);
            }
          }
          return ns;
        });
        setFood(generateFood());
      } else {
        copy.pop(); // Remove tail only if no food eaten
      }

      return copy;
    });
  }, [generateFood, highScore, lastAdTime, disableAds, food]);

  // Use requestAnimationFrame for smoother animation
  const gameLoop = useCallback(() => {
    moveSnake();
    if (gameStateRef.current.isPlaying && !gameStateRef.current.gameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [moveSnake]);

  useEffect(() => {
    if (isPlaying && !gameOver && !showLifeLost) {
      lastMoveTime.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, gameOver, showLifeLost, gameLoop]);

  /* ----------  optimized controls with input buffering  ---------- */
  const queueDirectionChange = useCallback(
    (newDir: { x: number; y: number }) => {
      // Don't allow direction changes if game is not playing
      if (!gameStateRef.current.isPlaying) return;

      const current = currentDirection.current;

      // Prevent immediate reversal
      if (
        (newDir.x === 1 && current.x === -1) ||
        (newDir.x === -1 && current.x === 1) ||
        (newDir.y === 1 && current.y === -1) ||
        (newDir.y === -1 && current.y === 1)
      ) {
        return;
      }

      // Only update if direction actually changed
      if (newDir.x !== current.x || newDir.y !== current.y) {
        nextDirection.current = newDir;
      }
    },
    []
  );

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const arrows = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        " ",
        "w",
        "W",
        "a",
        "A",
        "s",
        "S",
        "d",
        "D",
      ];
      if (arrows.includes(e.key)) e.preventDefault();
      if (!gameStateRef.current.isPlaying) return;

      let newDir: { x: number; y: number } | null = null;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          newDir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "s":
        case "S":
          newDir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          newDir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "d":
        case "D":
          newDir = { x: 1, y: 0 };
          break;
      }

      if (newDir) {
        queueDirectionChange(newDir);
      }
    },
    [queueDirectionChange]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  /* ----------  optimized touch controls  ---------- */
  const handleTouchButton = useCallback(
    (newDir: { x: number; y: number }) => {
      if (!gameStateRef.current.isPlaying) return;
      queueDirectionChange(newDir);
    },
    [queueDirectionChange]
  );

  /* ----------  touch event prevention  ---------- */
  const preventDefaultTouch = useCallback((e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("touchstart", preventDefaultTouch, {
      passive: false,
    });
    document.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchstart", preventDefaultTouch);
      document.removeEventListener("touchmove", preventDefaultTouch);
    };
  }, [preventDefaultTouch]);

  /* ----------  life / reset  ---------- */
  const loseLife = useCallback(async () => {
    // Immediately stop the game state to prevent further input
    gameStateRef.current.isPlaying = false;
    gameStateRef.current.showLifeLost = true;

    const nl = lives - 1;
    setLives(nl);
    localStorage.setItem(LIVES_STORAGE_KEY, nl.toString());

    if (score > 0) {
      try {
        const playerId = user?.uid || playerUser?.id;
        if (playerId) {
          await gameScoreService.saveScore(playerId, "snake-game", score);
        }
      } catch (error) {
        console.error("Failed to save score:", error);
      }
    }

    if (nl <= 0) {
      gameStateRef.current.gameOver = true;
      setGameOver(true);
      setLastLifeLoss(null);
      localStorage.removeItem(LAST_LIFE_LOSS_KEY);
      setShowLifeLost(false);
      if (onGameOver) onGameOver(score);
    } else {
      const now = Date.now();
      setLastLifeLoss(now);
      localStorage.setItem(LAST_LIFE_LOSS_KEY, now.toString());
      setShowLifeLost(true);
      setIsPlaying(false);
    }
  }, [lives, score, onGameOver, user, playerUser]);

  const continueGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    currentDirection.current = INITIAL_DIRECTION;
    nextDirection.current = INITIAL_DIRECTION;
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood());
    setShowLifeLost(false);
    setIsPlaying(true);
  }, [generateFood]);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    currentDirection.current = INITIAL_DIRECTION;
    nextDirection.current = INITIAL_DIRECTION;
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood());
    setGameOver(false);
    setShowLifeLost(false);
    setScore(0);
    setIsPlaying(false);
    // Only reset lives to full if this is a fresh start (no previous game session)
    // Don't reset lives when continuing after game over - respect the regeneration timer
  }, [generateFood]);

  const startGame = () => {
    // Check if user has any lives available (either current lives or regenerated lives)
    const currentTime = Date.now();
    let availableLives = lives;

    if (lives <= 0 && lastLifeLoss) {
      const timeSinceLastLoss = currentTime - lastLifeLoss;
      const regeneratedLives = Math.floor(
        timeSinceLastLoss / LIFE_REGENERATION_TIME
      );
      availableLives = Math.min(regeneratedLives, MAX_LIVES);

      if (availableLives > 0) {
        // Update lives if regeneration occurred
        setLives(availableLives);
        localStorage.setItem(LIVES_STORAGE_KEY, availableLives.toString());

        // Update last life loss time
        const newLastLoss =
          lastLifeLoss + regeneratedLives * LIFE_REGENERATION_TIME;
        setLastLifeLoss(newLastLoss);
        localStorage.setItem(LAST_LIFE_LOSS_KEY, newLastLoss.toString());
      }
    }

    // Only start game if lives are available
    if (availableLives > 0) {
      resetGame();
      setIsPlaying(true);
    }
  };

  // Add CSS to prevent text selection and tap highlight
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .snake-game-container * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      .snake-game-container button {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      .game-board {
        transform: translateZ(0);
        backface-visibility: hidden;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  /* ----------  render  ---------- */
  return (
    <div className="snake-game-container flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20 w-full max-w-2xl">
        {/* header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Snake Game
          </h1>

          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 text-white/80 text-sm sm:text-base">
            <div className="flex items-center space-x-2">
              <span>Lives:</span>
              <div className="flex space-x-1">
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                      i < lives ? "bg-red-500" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            <span>
              Score: <span className="font-bold text-green-400">{score}</span>
            </span>
            <span>
              High:{" "}
              <span className="font-bold text-yellow-400">{highScore}</span>
            </span>
          </div>

          {lastLifeLoss && lives < MAX_LIVES && (
            <div className="text-xs text-white/60 mt-1">
              Next life in:{" "}
              {Math.max(
                0,
                Math.ceil(
                  (LIFE_REGENERATION_TIME - (Date.now() - lastLifeLoss)) / 60000
                )
              )}{" "}
              min
            </div>
          )}

          <button
            onClick={() => setShowLeaderboard(true)}
            className="mt-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition text-sm sm:text-base"
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* optimized board with GPU acceleration */}
        <div className="relative mb-2 sm:mb-6 mx-auto w-full max-w-[min(95vw,500px)]">
          <div
            className="game-board grid gap-0 bg-slate-800/50 rounded-xl p-1 sm:p-3 md:p-4 border border-white/10"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              aspectRatio: "1 / 1",
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isHead = snake[0] && snake[0].x === x && snake[0].y === y;
              const isBody = snake.slice(1).some((s) => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  className={`
                    aspect-square rounded-[2px] transition-transform duration-75
                    ${isHead ? "bg-green-400 shadow-lg scale-110" : ""}
                    ${isBody ? "bg-green-500" : ""}
                    ${isFood ? "bg-red-500 animate-pulse shadow-lg" : ""}
                    ${!isHead && !isBody && !isFood ? "bg-slate-700/30" : ""}
                  `}
                />
              );
            })}
          </div>

          {/* overlays */}
          {showLifeLost && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                  Life Lost!
                </h2>
                <p className="text-base sm:text-lg mb-4">
                  Lives remaining: {lives}
                </p>
                <button
                  onClick={continueGame}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg font-semibold transition transform hover:scale-105 text-sm sm:text-base"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {gameOver && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                  Game Over!
                </h2>
                <p className="text-base sm:text-lg mb-4">
                  Final Score: {score}
                </p>
                {(() => {
                  const currentTime = Date.now();
                  let availableLives = lives;

                  if (lives <= 0 && lastLifeLoss) {
                    const timeSinceLastLoss = currentTime - lastLifeLoss;
                    const regeneratedLives = Math.floor(
                      timeSinceLastLoss / LIFE_REGENERATION_TIME
                    );
                    availableLives = Math.min(regeneratedLives, MAX_LIVES);
                  }

                  if (availableLives > 0) {
                    return (
                      <button
                        onClick={startGame}
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg font-semibold transition transform hover:scale-105 text-sm sm:text-base"
                      >
                        Play Again
                      </button>
                    );
                  } else {
                    const minutesUntilNextLife = lastLifeLoss
                      ? Math.ceil(
                          (LIFE_REGENERATION_TIME -
                            (currentTime - lastLifeLoss)) /
                            60000
                        )
                      : LIFE_REGENERATION_TIME / 60000;
                    return (
                      <div>
                        <p className="text-sm sm:text-base mb-4 text-yellow-300">
                          Next life in: {minutesUntilNextLife} minutes
                        </p>
                        <p className="text-xs sm:text-sm text-white/70 mb-4">
                          You need at least 1 life to play
                        </p>
                        <button
                          onClick={() => setShowLeaderboard(true)}
                          className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition text-sm sm:text-base"
                        >
                          🏆 Leaderboard
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {!isPlaying && !gameOver && !showLifeLost && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
                  Ready to Play?
                </h2>
                <button
                  onClick={startGame}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-semibold transition transform hover:scale-105 text-sm sm:text-base"
                >
                  Start Game
                </button>
              </div>
            </div>
          )}
        </div>

        {/* optimized controls */}
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-3 gap-3 md:hidden max-w-64 mx-auto">
            <div />
            <button
              onClick={() => handleTouchButton({ x: 0, y: -1 })}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-4 sm:p-5 rounded-lg touch-manipulation transition-colors duration-75"
            >
              ↑
            </button>
            <div />
            <button
              onClick={() => handleTouchButton({ x: -1, y: 0 })}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-4 sm:p-5 rounded-lg touch-manipulation transition-colors duration-75"
            >
              ←
            </button>
            <div />
            <button
              onClick={() => handleTouchButton({ x: 1, y: 0 })}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-4 sm:p-5 rounded-lg touch-manipulation transition-colors duration-75"
            >
              →
            </button>
            <div />
            <button
              onClick={() => handleTouchButton({ x: 0, y: 1 })}
              className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white p-4 sm:p-5 rounded-lg touch-manipulation transition-colors duration-75"
            >
              ↓
            </button>
          </div>

          <div className="text-center text-white/70 text-xs sm:text-sm">
            <div className="hidden md:block">
              Use arrow keys or WASD to move
            </div>
            <div className="md:hidden">
              Use buttons above to control the snake
            </div>
          </div>
        </div>
      </div>

      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />

      <InterstitialAd
        isVisible={showMilestoneAd}
        onClose={() => setShowMilestoneAd(false)}
        autoClose={true}
        autoCloseDelay={6}
        adSlot={`snake-milestone-${milestoneCount}`}
      />
    </div>
  );
}
