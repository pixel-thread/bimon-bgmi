// Card type
export interface CardType {
    id: number;
    icon: string;
    isFlipped: boolean;
    isMatched: boolean;
}

// Game statistics
export interface GameStats {
    moves: number;
    time: number;
    score: number;
    matchedPairs: number;
}

// Game state
export type GameState = "idle" | "playing" | "won";

// Analytics event types
export interface GameAnalytics {
    gamesPlayed: number;
    gamesCompleted: number;
    totalScore: number;
    bestScore: number;
    totalTime: number;
    bestTime: number;
    lastPlayedAt: string | null;
}

// Leaderboard entry
export interface LeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    highScore: number;
    lastPlayedAt: string;
}
