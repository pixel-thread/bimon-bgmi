// BGMI-themed card icons
export const CARD_ICONS = [
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

// Timing constants
export const GAME_CONFIG = {
    MATCH_DELAY: 500,      // Delay before hiding matched cards
    MISMATCH_DELAY: 1000,  // Delay before flipping back mismatched cards
    RESTART_DELAY: 600,    // Delay for restart animation
    TIMER_WARNING: 60,     // Show warning when timer reaches this (seconds)
} as const;

// Score calculation constants
export const SCORE_CONFIG = {
    BASE_SCORE: 1000,
    TIME_BONUS_MAX: 1000,
    TIME_PENALTY_PER_SECOND: 10,
    MOVE_BONUS_MAX: 500,
    MOVE_PENALTY_PER_MOVE: 20,
    COMBO_MULTIPLIER: 1.5,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
    SOUND_MUTED: "memory-game-sound-muted",
    ANALYTICS: "memory-game-analytics",
    OFFLINE_SCORES: "memory-game-offline-scores",
    HIGH_SCORE_CACHE: "memory-game-high-score-cache",
} as const;
