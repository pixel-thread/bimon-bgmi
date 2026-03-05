/**
 * Game Configuration — single source of truth for game-specific strings.
 * Everything that differs between BGMI and Free Fire lives here.
 * Usage: import { GAME } from "@/lib/game-config";
 *        then use GAME.currency, GAME.passName, etc.
 */

export type GameMode = "bgmi" | "freefire";

interface GameConfig {
    mode: GameMode;
    name: string;                // App/brand name
    fullName: string;            // Full display name
    gameName: string;            // Actual game name
    currency: string;            // "UC" or "Diamonds"
    currencyEmoji: string;       // "💰" or "💎"
    currencyPlural: string;      // "UC" or "Diamonds"
    passName: string;            // "Royal Pass" or "Elite Pass"
    passEmoji: string;           // "👑"
    idLabel: string;             // "BGMI ID" or "Free Fire UID"
    idPlaceholder: string;       // placeholder text for ID input
    hasUID: boolean;             // whether the game uses a separate UID field
    // Scoring
    scoringSystem: "bgmi" | "ffws";
    booyahBonus: boolean;        // Free Fire has Booyah (1st place bonus)
}

const GAME_CONFIGS: Record<GameMode, GameConfig> = {
    bgmi: {
        mode: "bgmi",
        name: "PUBGMI",
        fullName: "PUBG Mobile India Tournament Platform",
        gameName: "BGMI",
        currency: "UC",
        currencyEmoji: "💰",
        currencyPlural: "UC",
        passName: "Royal Pass",
        passEmoji: "👑",
        idLabel: "BGMI ID",
        idPlaceholder: "Your BGMI character ID",
        hasUID: false,
        scoringSystem: "bgmi",
        booyahBonus: false,
    },
    freefire: {
        mode: "freefire",
        name: "BOO-YAH",
        fullName: "Free Fire Tournament Platform",
        gameName: "Free Fire",
        currency: "Diamonds",
        currencyEmoji: "💎",
        currencyPlural: "Diamonds",
        passName: "Elite Pass",
        passEmoji: "👑",
        idLabel: "Free Fire UID",
        idPlaceholder: "Your Free Fire UID (numeric)",
        hasUID: true,
        scoringSystem: "ffws",
        booyahBonus: true,
    },
};

/**
 * Current game config — reads from NEXT_PUBLIC_GAME_MODE env var.
 * Defaults to "bgmi" if not set (safe for existing BGMI deployment).
 */
export const GAME_MODE: GameMode = (process.env.NEXT_PUBLIC_GAME_MODE as GameMode) || "bgmi";
export const GAME: GameConfig = GAME_CONFIGS[GAME_MODE];
