"use client";

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../constants";
import type { GameAnalytics } from "../types";

const DEFAULT_ANALYTICS: GameAnalytics = {
    gamesPlayed: 0,
    gamesCompleted: 0,
    totalScore: 0,
    bestScore: 0,
    totalTime: 0,
    bestTime: 0,
    lastPlayedAt: null,
};

export function useGameAnalytics() {
    const [analytics, setAnalytics] = useState<GameAnalytics>(DEFAULT_ANALYTICS);

    // Load analytics from localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.ANALYTICS);
            if (stored) {
                setAnalytics(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Error loading analytics:", error);
        }
    }, []);

    // Save analytics to localStorage
    const saveAnalytics = useCallback((newAnalytics: GameAnalytics) => {
        if (typeof window === "undefined") return;
        try {
            localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(newAnalytics));
            setAnalytics(newAnalytics);
        } catch (error) {
            console.error("Error saving analytics:", error);
        }
    }, []);

    // Track game start
    const trackGameStart = useCallback(() => {
        const updated = {
            ...analytics,
            gamesPlayed: analytics.gamesPlayed + 1,
            lastPlayedAt: new Date().toISOString(),
        };
        saveAnalytics(updated);
    }, [analytics, saveAnalytics]);

    // Track game completion
    const trackGameComplete = useCallback((score: number, time: number) => {
        const updated = {
            ...analytics,
            gamesCompleted: analytics.gamesCompleted + 1,
            totalScore: analytics.totalScore + score,
            bestScore: Math.max(analytics.bestScore, score),
            totalTime: analytics.totalTime + time,
            bestTime: analytics.bestTime === 0 ? time : Math.min(analytics.bestTime, time),
            lastPlayedAt: new Date().toISOString(),
        };
        saveAnalytics(updated);
    }, [analytics, saveAnalytics]);

    // Get completion rate
    const getCompletionRate = useCallback(() => {
        if (analytics.gamesPlayed === 0) return 0;
        return Math.round((analytics.gamesCompleted / analytics.gamesPlayed) * 100);
    }, [analytics]);

    // Get average score
    const getAverageScore = useCallback(() => {
        if (analytics.gamesCompleted === 0) return 0;
        return Math.round(analytics.totalScore / analytics.gamesCompleted);
    }, [analytics]);

    // Get average time
    const getAverageTime = useCallback(() => {
        if (analytics.gamesCompleted === 0) return 0;
        return Math.round(analytics.totalTime / analytics.gamesCompleted);
    }, [analytics]);

    return {
        analytics,
        trackGameStart,
        trackGameComplete,
        getCompletionRate,
        getAverageScore,
        getAverageTime,
    };
}
