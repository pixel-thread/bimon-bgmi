"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { Leaderboard } from "./Leaderboard";
import { useAuth } from "@/hooks/useAuth";
import { gameScoreService } from "@/lib/gameScoreService";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BannerAd from "@/components/ads/BannerAd";
import InterstitialAd from "@/components/ads/InterstitialAd";
import { useAdManager } from "@/lib/adService";

// Interface for the pipe object
interface Pipe {
  id: number;
  x: number;
  gapTop: number;
  scored: boolean;
}

// Game constants
const MAX_LIVES = 5;
const MAX_PIPES = 5;
const LIFE_REGENERATION_TIME = 30 * 60 * 1000;
const LIVES_STORAGE_KEY = "flappy_bird_lives";
const LAST_LIFE_LOSS_KEY = "flappy_bird_last_life_loss";
const FIXED_FPS = 60;
const FIXED_FRAME_TIME = 1000 / FIXED_FPS;

export default function FlappyBird() {
  const { user, playerUser } = useAuth();

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [gameOverCount, setGameOverCount] = useState(0);

  // Ad management
  const { shouldShowAd, recordAdShown } = useAdManager();
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Death-fall flag
  const [isDying, setIsDying] = useState(false);
  const gameOverTriggered = useRef(false);

  // Animation controls
  const birdControls = useAnimation();
  const pipeControls = useAnimation();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Lives system state
  const [lives, setLives] = useState(MAX_LIVES);
  const [lastLifeLoss, setLastLifeLoss] = useState<number | null>(null);
  const [timeUntilNextLife, setTimeUntilNextLife] = useState(0);

  // Game constants
  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 600;
  const BIRD_WIDTH = 40;
  const BIRD_HEIGHT = 30;
  const PIPE_WIDTH = 60;
  const BASE_PIPE_GAP = 150;
  const GROUND_HEIGHT = 112;
  const BASE_GRAVITY = 0.7;
  const JUMP_VELOCITY = -8;
  const BASE_PIPE_SPEED = 2;
  const BASE_PIPE_SPAWN_INTERVAL = 3000;
  const BASE_MIN_PIPE_SPACING = 250; // Base minimum distance between pipes

  // Calculate dynamic values
  const getDynamicValues = (currentScore: number) => {
    const difficultyFactor = Math.min(1 + currentScore * 0.005, 1.3);
    const pipeSpeed = Math.min(
      BASE_PIPE_SPEED * (1 + currentScore * 0.002),
      BASE_PIPE_SPEED * 1.25
    );
    const pipeGap = Math.max(
      BASE_PIPE_GAP * (1 - currentScore * 0.0008),
      BASE_PIPE_GAP * 0.85
    );
    const gravity = Math.min(
      BASE_GRAVITY * (1 + currentScore * 0.0015),
      BASE_GRAVITY * 1.15
    );
    const spawnInterval = Math.max(
      BASE_PIPE_SPAWN_INTERVAL * (1 - currentScore * 0.001),
      BASE_PIPE_SPAWN_INTERVAL * 0.75
    );
    // Dynamic pipe spacing - decreases with score for increased difficulty
    const pipeSpacing = Math.max(
      BASE_MIN_PIPE_SPACING * (1 - currentScore * 0.001),
      BASE_MIN_PIPE_SPACING * 0.70
    );
    return { pipeSpeed, pipeGap, gravity, spawnInterval, difficultyFactor, pipeSpacing };
  };

  // Bird and environment state
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdX, setBirdX] = useState(GAME_WIDTH / 2 - BIRD_WIDTH / 2);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [scale, setScale] = useState(1);
  const [bestScore, setBestScore] = useState(0);

  // Use refs to track pipe state to avoid stale closures
  const pipesRef = useRef<Pipe[]>([]);
  const pipeIdCounter = useRef(0);

  // Update ref whenever pipes state changes
  useEffect(() => {
    pipesRef.current = pipes;
  }, [pipes]);

  // Function to handle game over
  const handleGameOver = useCallback(() => {
    if (gameOverTriggered.current) return;
    gameOverTriggered.current = true;
    setIsDying(true);
    birdControls.start({ rotate: 90, transition: { duration: 0.5 } });
    
    // Set game over after a delay to allow death animation
    setTimeout(() => {
      setGameOver(true);
      setIsDying(false);
    }, 800);
  }, [birdControls]);

  // Function to lose a life
  const loseLife = () => {
    if (lives > 0) {
      const newLives = lives - 1;
      const now = Date.now();
      setLives(newLives);
      localStorage.setItem(LIVES_STORAGE_KEY, newLives.toString());
      if (!lastLifeLoss || lives === MAX_LIVES) {
        setLastLifeLoss(now);
        localStorage.setItem(LAST_LIFE_LOSS_KEY, now.toString());
      }
    }
  };

  // Function to reset the game state
  const handleRestart = () => {
    if (lives === 0) return;
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setBirdY(GAME_HEIGHT / 2);
    setVelocity(0);
    setPipes([]);
    pipesRef.current = [];
    pipeIdCounter.current = 0;
    gameOverTriggered.current = false;
    birdControls.start({ rotate: 0, transition: { duration: 0.2 } });
    setIsLeaderboardOpen(false);
    setIsDying(false);
  };

  // Initialize lives from localStorage
  useEffect(() => {
    const storedLives = localStorage.getItem(LIVES_STORAGE_KEY);
    const storedLastLifeLoss = localStorage.getItem(LAST_LIFE_LOSS_KEY);
    if (storedLives !== null) {
      const parsedLives = parseInt(storedLives);
      const parsedLastLifeLoss = storedLastLifeLoss ? parseInt(storedLastLifeLoss) : null;
      if (parsedLives < MAX_LIVES && parsedLastLifeLoss) {
        const timePassed = Date.now() - parsedLastLifeLoss;
        const livesToRegenerate = Math.floor(timePassed / LIFE_REGENERATION_TIME);
        const newLives = Math.min(MAX_LIVES, parsedLives + livesToRegenerate);
        setLives(newLives);
        localStorage.setItem(LIVES_STORAGE_KEY, newLives.toString());
        if (newLives < MAX_LIVES) {
          const adjustedLastLifeLoss = parsedLastLifeLoss + livesToRegenerate * LIFE_REGENERATION_TIME;
          setLastLifeLoss(adjustedLastLifeLoss);
          localStorage.setItem(LAST_LIFE_LOSS_KEY, adjustedLastLifeLoss.toString());
        } else {
          setLastLifeLoss(null);
          localStorage.removeItem(LAST_LIFE_LOSS_KEY);
        }
      } else {
        setLives(parsedLives);
        setLastLifeLoss(parsedLastLifeLoss);
      }
    }
  }, []);

  // Lives regeneration timer
  useEffect(() => {
    if (lives >= MAX_LIVES || !lastLifeLoss) {
      setTimeUntilNextLife(0);
      return;
    }
    const now = Date.now();
    const timeSinceLastLoss = now - lastLifeLoss;
    const initialTimeUntilNext = LIFE_REGENERATION_TIME - (timeSinceLastLoss % LIFE_REGENERATION_TIME);
    const isCloseToRegeneration = initialTimeUntilNext <= 5000;
    const interval = setInterval(
      () => {
        const currentTime = Date.now();
        const currentTimeSinceLastLoss = currentTime - lastLifeLoss;
        const timeUntilNext = LIFE_REGENERATION_TIME - (currentTimeSinceLastLoss % LIFE_REGENERATION_TIME);
        if (timeUntilNext <= 1000) {
          setLives((prevLives) => {
            const newLives = Math.min(MAX_LIVES, prevLives + 1);
            localStorage.setItem(LIVES_STORAGE_KEY, newLives.toString());
            return newLives;
          });
          setLastLifeLoss((prevLastLifeLoss) => {
            if (!prevLastLifeLoss) return null;
            const newLives = Math.min(MAX_LIVES, lives + 1);
            if (newLives >= MAX_LIVES) {
              localStorage.removeItem(LAST_LIFE_LOSS_KEY);
              setTimeUntilNextLife(0);
              return null;
            } else {
              const newLastLifeLoss = prevLastLifeLoss + LIFE_REGENERATION_TIME;
              localStorage.setItem(LAST_LIFE_LOSS_KEY, newLastLifeLoss.toString());
              return newLastLifeLoss;
            }
          });
        } else {
          setTimeUntilNextLife(timeUntilNext);
        }
      },
      isCloseToRegeneration ? 1000 : 5000
    );
    return () => clearInterval(interval);
  }, [lives, lastLifeLoss]);

  // Responsive scaling
  useEffect(() => {
    const updateScale = () => {
      if (typeof window !== "undefined") {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const scaleX = windowWidth / GAME_WIDTH;
        const scaleY = windowHeight / GAME_HEIGHT;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Idle floating animation
  useEffect(() => {
    if (!gameStarted && !gameOver) {
      const idleLoop = setInterval(() => {
        const time = Date.now() / 800;
        const verticalOffset = Math.sin(time) * 10;
        setBirdY(GAME_HEIGHT / 2 + verticalOffset);
        setBirdX(GAME_WIDTH / 2 - BIRD_WIDTH / 2 + Math.cos(time) * 3);
        const tilt = -verticalOffset * 0.3;
        birdControls.start({ rotate: tilt, transition: { duration: 0.2 } });
      }, FIXED_FRAME_TIME);
      return () => clearInterval(idleLoop);
    } else {
      setBirdX(GAME_WIDTH / 2 - BIRD_WIDTH / 2);
    }
  }, [gameStarted, gameOver, birdControls]);

  // Main game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    let lastTime = performance.now();
    let accumulator = 0;
    let animationId: number;
    let lastSpawnTime = 0;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      const cappedDelta = Math.min(deltaTime, 50);
      accumulator += cappedDelta;

      while (accumulator >= FIXED_FRAME_TIME) {
        const { gravity: currentGravity, pipeSpeed: currentPipeSpeed, spawnInterval, pipeGap } = getDynamicValues(score);

        // Death-fall physics
        if (isDying) {
          setVelocity((v) => v + BASE_GRAVITY);
          setBirdY((y) => {
            const newY = y + velocity;
            const groundY = GAME_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT;
            if (newY >= groundY) {
              setVelocity(0);
              return groundY;
            }
            return Math.max(0, newY);
          });
        } else {
          // Normal gameplay physics
          setVelocity((prev) => prev + currentGravity);
          setBirdY((prevY) => {
            const newY = prevY + velocity;
            if (newY + BIRD_HEIGHT > GAME_HEIGHT - GROUND_HEIGHT) {
              return GAME_HEIGHT - GROUND_HEIGHT - BIRD_HEIGHT;
            }
            return Math.max(0, newY);
          });

          // Update pipes - move them left
          setPipes((prevPipes) => {
            const updatedPipes = prevPipes
              .map((pipe) => ({ ...pipe, x: pipe.x - currentPipeSpeed }))
              .filter((pipe) => pipe.x + PIPE_WIDTH > -50);
            
            // Keep only the most recent pipes
            return updatedPipes.length > MAX_PIPES ? updatedPipes.slice(-MAX_PIPES) : updatedPipes;
          });

          // Pipe spawning - FIXED LOGIC with dynamic spacing
          const currentPipes = pipesRef.current;
          const { pipeSpacing } = getDynamicValues(score);
          const canSpawn = currentPipes.length === 0 || 
                          currentPipes[currentPipes.length - 1].x < GAME_WIDTH - pipeSpacing;
          
          if (canSpawn && currentTime - lastSpawnTime >= spawnInterval) {
            const minGap = 80;
            const maxGap = GAME_HEIGHT - pipeGap - 120;
            const scoreBias = Math.min(score * 0.8, 25);
            const dynamicMinGap = Math.max(60, minGap + scoreBias);
            const dynamicMaxGap = Math.min(GAME_HEIGHT - pipeGap - 80, maxGap - scoreBias);
            const gapTop = Math.random() * (dynamicMaxGap - dynamicMinGap) + dynamicMinGap;

            setPipes((prev) => {
              if (prev.length < MAX_PIPES) {
                return [
                  ...prev,
                  { id: pipeIdCounter.current++, x: GAME_WIDTH, gapTop, scored: false },
                ];
              }
              return prev;
            });

            lastSpawnTime = currentTime;
          }
        }

        accumulator -= FIXED_FRAME_TIME;
      }

      // Collision detection (only when not dying and not game over)
      if (!gameOver && !isDying && !gameOverTriggered.current) {
        const birdTop = birdY;
        const birdBottom = birdY + BIRD_HEIGHT;
        const birdLeft = birdX;
        const birdRight = birdX + BIRD_WIDTH;

        for (const pipe of pipesRef.current) {
          const pipeLeft = pipe.x;
          const pipeRight = pipe.x + PIPE_WIDTH;
          const { pipeGap: currentPipeGap } = getDynamicValues(score);
          const pipeTop = pipe.gapTop;
          const pipeBottom = pipe.gapTop + currentPipeGap;

          // Check collision with pipes
          if (
            birdRight > pipeLeft &&
            birdLeft < pipeRight &&
            (birdTop < pipeTop || birdBottom > pipeBottom)
          ) {
            handleGameOver();
            loseLife();
            return;
          }

          // Check if bird passed pipe for scoring
          if (!pipe.scored && birdRight > pipeRight) {
            setScore((prev) => prev + 1);
            setPipes((prevPipes) =>
              prevPipes.map((p) => (p.id === pipe.id ? { ...p, scored: true } : p))
            );
          }
        }

        // Check ground and ceiling collision
        if (birdY + BIRD_HEIGHT >= GAME_HEIGHT - GROUND_HEIGHT || birdY <= 0) {
          handleGameOver();
          loseLife();
          return;
        }
      }

      if (!gameOver || isDying) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [
    gameStarted,
    gameOver,
    isDying,
    birdY,
    velocity,
    birdX,
    birdControls,
    score,
    handleGameOver,
  ]);

  // Track if we've saved the score for this game session
  const hasSavedScore = useRef(false);
  useEffect(() => {
    if (!gameOver) {
      hasSavedScore.current = false;
    }
  }, [gameOver]);

  // Save score when game is over
  useEffect(() => {
    if (gameOver && score > 0 && !hasSavedScore.current) {
      hasSavedScore.current = true;
      const saveAndUpdateScore = async () => {
        const playerId = user?.uid || playerUser?.id;
        if (!playerId) {
          hasSavedScore.current = false;
          return;
        }
        try {
          const result = await gameScoreService.saveScore(
            playerId,
            "flappy-bird",
            score,
            {
              playerName: user?.displayName || playerUser?.name || "Anonymous",
              livesRemaining: lives,
              timestamp: new Date().toISOString(),
              sessionId: Date.now().toString(),
            }
          );
          if (result.saved) {
            toast.success(`🎉 New High Score: ${result.highScore}!`, {
              position: "top-center",
              duration: 5000,
              style: {
                background: "#4CAF50",
                color: "white",
                fontSize: "1.1em",
                padding: "12px 20px",
                borderRadius: "4px",
                fontWeight: "bold",
              },
            });
          }
          setBestScore((prev) => Math.max(prev, result.highScore));
        } catch (error) {
          hasSavedScore.current = false;
          toast.error("Failed to save score. Please try again.", {
            position: "top-center",
            duration: 3000,
          });
        }
      };
      saveAndUpdateScore().catch(() => {
        hasSavedScore.current = false;
      });
    }
  }, [gameOver, score, user, playerUser, lives]);

  // Handle jump
  const handleJump = () => {
    if (lives === 0) return;
    if (!gameStarted) {
      setGameStarted(true);
    }
    setVelocity(JUMP_VELOCITY);
    birdControls
      .start({ rotate: -20, transition: { duration: 0.1 } })
      .then(() =>
        birdControls.start({
          rotate: 0,
          transition: { type: "spring", stiffness: 100 },
        })
      );
  };

  // Handle primary action
  const handlePrimaryAction = () => {
    if (gameOver && lives > 0) {
      handleRestart();
    } else if (!gameOver && lives > 0) {
      handleJump();
    }
  };

  // Touch tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // Input listeners
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && lives > 0) {
        e.preventDefault();
        handlePrimaryAction();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isLeaderboardOpen || lives === 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      if (
        touch.clientX >= rect.left &&
        touch.clientX <= rect.right &&
        touch.clientY >= rect.top &&
        touch.clientY <= rect.bottom
      ) {
        e.preventDefault();
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || isLeaderboardOpen || lives === 0) return;
      const touch = e.changedTouches[0];
      const start = touchStartRef.current;
      const deltaX = Math.abs(touch.clientX - start.x);
      const deltaY = Math.abs(touch.clientY - start.y);
      const deltaTime = Date.now() - start.time;
      if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
        e.preventDefault();
        handlePrimaryAction();
      }
      touchStartRef.current = null;
    };

    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [gameOver, gameStarted, isLeaderboardOpen, lives]);

  // Format time helper
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-900 pt-0">
      <div
        className="relative overflow-hidden bg-blue-500"
        style={{
          width: `${GAME_WIDTH}px`,
          height: `${GAME_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top center",
        }}
        ref={canvasRef}
        onClick={(e) => {
          if (!isLeaderboardOpen && e.target === e.currentTarget && lives > 0) {
            e.preventDefault();
            handlePrimaryAction();
          }
        }}
      >
        {/* Background */}
        <Image
          src="/images/games/flappy-bird/fb-game-background.png"
          alt="Game Background"
          fill
          style={{
            objectFit: "cover",
            objectPosition: "center top",
            transform: "translateY(-100px)",
          }}
          priority
        />

        {/* Lives Display */}
        <div className="absolute top-4 right-4 flex space-x-1 z-20">
          {Array.from({ length: MAX_LIVES }).map((_, index) => (
            <Image
              key={`life-${index}-${lives}`}
              src={
                index < lives
                  ? "/images/games/flappy-bird/flappy-bird-heart.png"
                  : "/images/games/flappy-bird/flappy-bird-heart-empty.png"
              }
              alt={index < lives ? "Full Heart" : "Empty Heart"}
              width={24}
              height={24}
              className="drop-shadow-sm"
            />
          ))}
        </div>

        {/* No Lives Timer */}
        {lives === 0 && !gameOver && (
          <motion.div
            className="absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2 text-center z-20"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <p className="text-2xl font-pixel text-white mb-4 retro-shadow">OUT OF LIVES</p>
            <p className="text-3xl font-pixel text-yellow-400 mb-6 retro-shadow">
              {formatTime(timeUntilNextLife)}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsLeaderboardOpen(true);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsLeaderboardOpen(true);
              }}
              className="px-8 py-3 text-white bg-gradient-to-b from-yellow-400 to-yellow-600 text-gray-900 font-pixel text-xs rounded-none shadow-lg hover:from-yellow-300 hover:to-yellow-500 transition-all duration-200 transform hover:scale-105 border-2 border-yellow-800 retro-shadow touch-manipulation select-none"
              style={{ touchAction: "manipulation", userSelect: "none" }}
            >
              View Leaderboard
            </button>
          </motion.div>
        )}

        {/* Tap to Start */}
        {!gameStarted && !gameOver && lives > 0 && (
          <motion.div
            className="absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center z-20"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsLeaderboardOpen(true);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsLeaderboardOpen(true);
              }}
              className="px-6 py-2 text-white bg-gradient-to-b from-yellow-400 to-yellow-600 text-gray-900 font-pixel text-xs rounded-none shadow-lg hover:from-yellow-300 hover:to-yellow-500 transition-all duration-200 transform hover:scale-105 border-2 border-yellow-800 retro-shadow touch-manipulation select-none mb-4"
              style={{ touchAction: "manipulation", userSelect: "none" }}
            >
              View Leaderboard
            </button>
            <p className="text-xl font-pixel text-white retro-shadow animate-pulse">TAP TO START</p>
          </motion.div>
        )}

        {/* Game Over */}
        {gameOver && (
          <motion.div
            className="absolute left-1/2 top-1/3 transform -translate-x-1/2 -translate-y-1/2 z-20 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-6">
              <div className="text-3xl font-bold text-yellow-400 mb-4">Game Over!</div>
              <div className="text-xl text-white mb-6">Score: {score}</div>
              {lives === 0 ? (
                <>
                  <p className="text-sm font-pixel text-white retro-shadow mt-2">OUT OF LIVES</p>
                  <p className="text-2xl font-pixel text-yellow-400 mb-6 retro-shadow">
                    {formatTime(timeUntilNextLife)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsLeaderboardOpen(true);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsLeaderboardOpen(true);
                    }}
                    className="px-8 py-3 bg-gradient-to-b from-yellow-400 to-yellow-600 text-gray-900 font-pixel text-xs rounded-none shadow-lg hover:from-yellow-300 hover:to-yellow-500 transition-all duration-200 transform hover:scale-105 border-2 border-yellow-800 retro-shadow touch-manipulation select-none"
                    style={{ touchAction: "manipulation", userSelect: "none" }}
                  >
                    🏆 SCORES
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsLeaderboardOpen(true);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsLeaderboardOpen(true);
                    }}
                    className="px-6 py-2 text-white bg-gradient-to-b from-yellow-400 to-yellow-600 text-gray-900 font-pixel text-xs rounded-none shadow-lg hover:from-yellow-300 hover:to-yellow-500 transition-all duration-200 transform hover:scale-105 border-2 border-yellow-800 retro-shadow touch-manipulation select-none mt-4"
                    style={{ touchAction: "manipulation", userSelect: "none" }}
                  >
                    View Leaderboard
                  </button>
                  <p className="text-sm font-pixel text-white retro-shadow mt-4 animate-pulse">
                    TAP TO RESTART
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Bird */}
        <motion.div
          className="absolute z-10"
          style={{
            width: BIRD_WIDTH,
            height: BIRD_HEIGHT,
            left: birdX,
            y: birdY,
          }}
          animate={birdControls}
        >
          <Image
            src="/images/games/flappy-bird/flappy-bird2.png"
            alt="Flappy Bird"
            width={BIRD_WIDTH}
            height={BIRD_HEIGHT}
            priority
          />
        </motion.div>

        {/* Pipes */}
        {pipes.map((pipe) => (
          <motion.div key={pipe.id} className="absolute z-5" style={{ x: pipe.x }} animate={pipeControls}>
            {/* Top Pipe */}
            <div className="absolute" style={{ width: PIPE_WIDTH, height: pipe.gapTop, top: 0 }}>
              <Image
                src="/images/games/flappy-bird/flappybird-pipe.png"
                alt="Top Pipe"
                fill
                style={{
                  objectFit: "fill",
                  transform: "rotate(180deg)",
                  imageRendering: "pixelated",
                }}
                priority
              />
            </div>
            {/* Bottom Pipe */}
            <div
              className="absolute"
              style={{
                width: PIPE_WIDTH,
                height: GAME_HEIGHT - (pipe.gapTop + getDynamicValues(score).pipeGap),
                top: pipe.gapTop + getDynamicValues(score).pipeGap,
              }}
            >
              <Image
                src="/images/games/flappy-bird/flappybird-pipe.png"
                alt="Bottom Pipe"
                fill
                style={{
                  objectFit: "fill",
                  imageRendering: "pixelated",
                }}
                priority
              />
            </div>
          </motion.div>
        ))}

        {/* Ground */}
        <div className="absolute bottom-0 w-full z-5" style={{ height: GROUND_HEIGHT }}>
          <Image
            src="/images/games/flappy-bird/bottom-background.png"
            alt="Ground"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        {/* Score Display */}
        {!gameOver && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center z-10">
            <div className="text-4xl font-pixel text-white retro-shadow">{score}</div>
            {user?.uid && bestScore > 0 && (
              <div className="text-xs font-pixel text-yellow-300 retro-shadow mt-1">BEST: {bestScore}</div>
            )}
          </div>
        )}
      </div>

      {/* Game Description */}
      <div className="mt-8 max-w-md mx-auto text-center px-4 mb-8">
        <h2 className="text-2xl font-pixel text-white mb-4 retro-shadow">FLAPPY BIRD CHALLENGE</h2>
        <p className="text-gray-300 mb-4 font-pixel text-xs leading-relaxed">
          NAVIGATE THE BIRD THROUGH PIPES BY TIMING YOUR JUMPS PERFECTLY. CLICK OR PRESS SPACE TO FLAP UPWARD. AVOID
          HITTING PIPES OR GROUND!
        </p>
        <div className="flex justify-center space-x-4 text-xs font-pixel text-gray-400">
          <span>🎮 CLICK/SPACE</span>
          <span>
            <Image
              src="/images/games/flappy-bird/flappy-bird-heart.png"
              alt="Heart"
              width={16}
              height={16}
              className="inline-block mr-1"
            />
            {lives}/{MAX_LIVES}
          </span>
          <span>🏆 HIGH SCORE</span>
        </div>
      </div>

      {/* Leaderboard */}
      {isLeaderboardOpen && (
        <Leaderboard
          gameId="flappy-bird"
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
        />
      )}

      {/* Banner Ad */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center z-50">
        <BannerAd
          adSlot="/22989534981/example_banner"
          size={{ width: 320, height: 50 }}
          className="w-full max-w-md h-[50px] bg-gray-200 flex items-center justify-center"
        />
      </div>

      {/* Interstitial Ad */}
      <InterstitialAd
        adSlot="/22989534981/example_interstitial"
        isVisible={showInterstitial}
        onClose={() => setShowInterstitial(false)}
        autoClose={true}
        autoCloseDelay={10}
      />
    </div>
  );
}