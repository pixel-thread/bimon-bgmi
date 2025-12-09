"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CARD_ICONS, GAME_CONFIG, SCORE_CONFIG, STORAGE_KEYS } from "../constants";
import type { CardType, GameStats, GameState } from "../types";

interface UseMemoryGameProps {
    playerId?: string;
    onScoreSubmit?: (score: number, isNewHighScore: boolean) => void;
}

interface UseMemoryGameReturn {
    // State
    cards: CardType[];
    gameStats: GameStats;
    gameState: GameState;
    highScore: number | null;
    topScore: number | null;
    isProcessing: boolean;
    isRestarting: boolean;
    hasStarted: boolean;
    comboCount: number;

    // Loading & Error states
    isLoadingScores: boolean;
    hasError: boolean;
    errorMessage: string | null;

    // Actions
    startGame: () => void;
    handleCardClick: (cardId: number) => void;
    retryFetch: () => void;

    // Computed
    isTimerWarning: boolean;
    isTopScorer: boolean;
    progressPercentage: number;
}

export function useMemoryGame({ playerId, onScoreSubmit }: UseMemoryGameProps = {}): UseMemoryGameReturn {
    // Card state
    const [cards, setCards] = useState<CardType[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);

    // Game state
    const [gameState, setGameState] = useState<GameState>("idle");
    const [gameStats, setGameStats] = useState<GameStats>({
        moves: 0,
        time: 0,
        score: 0,
        matchedPairs: 0,
    });

    // Scores
    const [highScore, setHighScore] = useState<number | null>(null);
    const [topScore, setTopScore] = useState<number | null>(null);

    // UI state
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [comboCount, setComboCount] = useState(0);

    // Loading & Error state
    const [isLoadingScores, setIsLoadingScores] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Track last match for combo
    const lastMatchRef = useRef<boolean>(false);

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
        setComboCount(0);
        lastMatchRef.current = false;
    }, []);

    // Start game
    const startGame = useCallback(() => {
        if (gameState === "playing" || gameState === "won") {
            setIsRestarting(true);
            setTimeout(() => {
                initializeGame();
                setGameState("playing");
                setIsRestarting(false);
            }, GAME_CONFIG.RESTART_DELAY);
        } else {
            initializeGame();
            setGameState("playing");
        }
    }, [gameState, initializeGame]);

    // Fetch scores with offline fallback
    const fetchScores = useCallback(async () => {
        setIsLoadingScores(true);
        setHasError(false);
        setErrorMessage(null);

        // Try to load cached scores first
        try {
            const cached = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE_CACHE);
            if (cached) {
                const { highScore: cachedHigh, topScore: cachedTop } = JSON.parse(cached);
                setHighScore(cachedHigh);
                setTopScore(cachedTop);
            }
        } catch {
            // Ignore cache errors
        }

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

        // Fetch leaderboard top score
        try {
            const res = await fetch("/api/admin/games");
            if (res.ok) {
                const data = await res.json();
                if (data.leaderboard && data.leaderboard.length > 0) {
                    setTopScore(data.leaderboard[0].highScore);
                }
            } else {
                throw new Error("Failed to fetch leaderboard");
            }
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            setHasError(true);
            setErrorMessage("Couldn't load scores. Playing offline.");
        }

        // Cache scores for offline use
        try {
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORE_CACHE, JSON.stringify({
                highScore,
                topScore,
                cachedAt: Date.now(),
            }));
        } catch {
            // Ignore cache errors
        }

        setIsLoadingScores(false);
    }, [playerId, highScore, topScore]);

    // Initialize and fetch scores
    useEffect(() => {
        initializeGame();
        fetchScores();
    }, [initializeGame, fetchScores]);

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
        if (gameStats.matchedPairs === CARD_ICONS.length && gameState === "playing") {
            setGameState("won");

            // Calculate final score
            const timeBonus = Math.max(0, SCORE_CONFIG.TIME_BONUS_MAX - gameStats.time * SCORE_CONFIG.TIME_PENALTY_PER_SECOND);
            const moveBonus = Math.max(0, SCORE_CONFIG.MOVE_BONUS_MAX - gameStats.moves * SCORE_CONFIG.MOVE_PENALTY_PER_MOVE);
            const finalScore = SCORE_CONFIG.BASE_SCORE + timeBonus + moveBonus;

            setGameStats((prev) => ({ ...prev, score: finalScore }));

            // Notify parent and check high score
            const isNewHighScore = !highScore || finalScore > highScore;
            if (isNewHighScore) {
                setHighScore(finalScore);
            }
            onScoreSubmit?.(finalScore, isNewHighScore);
        }
    }, [gameStats.matchedPairs, gameState, gameStats.time, gameStats.moves, highScore, onScoreSubmit]);

    // Handle card click
    const handleCardClick = useCallback((cardId: number) => {
        if (isProcessing || gameState !== "playing" || isRestarting) return;
        if (flippedCards.includes(cardId)) return;
        if (cards[cardId]?.isMatched) return;
        if (flippedCards.length >= 2) return;

        if (!hasStarted) setHasStarted(true);

        // Flip the card
        setCards((prev) =>
            prev.map((card) =>
                card.id === cardId ? { ...card, isFlipped: true } : card
            )
        );
        setFlippedCards((prev) => [...prev, cardId]);
    }, [isProcessing, gameState, isRestarting, flippedCards, cards, hasStarted]);

    // Check for match when two cards are flipped
    useEffect(() => {
        if (flippedCards.length === 2) {
            setIsProcessing(true);
            setGameStats((prev) => ({ ...prev, moves: prev.moves + 1 }));

            const [first, second] = flippedCards;
            if (cards[first].icon === cards[second].icon) {
                // Match found - track combo
                if (lastMatchRef.current) {
                    setComboCount((prev) => prev + 1);
                } else {
                    setComboCount(1);
                }
                lastMatchRef.current = true;

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
                // No match - reset combo
                lastMatchRef.current = false;
                setComboCount(0);

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
    }, [flippedCards, cards]);

    // Computed values
    const isTimerWarning = gameState === "playing" && gameStats.time >= GAME_CONFIG.TIMER_WARNING;
    const isTopScorer = !!(highScore && topScore && highScore >= topScore);
    const progressPercentage = topScore && highScore
        ? Math.min((highScore / topScore) * 100, 100)
        : 0;

    return {
        // State
        cards,
        gameStats,
        gameState,
        highScore,
        topScore,
        isProcessing,
        isRestarting,
        hasStarted,
        comboCount,

        // Loading & Error
        isLoadingScores,
        hasError,
        errorMessage,

        // Actions
        startGame,
        handleCardClick,
        retryFetch: fetchScores,

        // Computed
        isTimerWarning,
        isTopScorer,
        progressPercentage,
    };
}
