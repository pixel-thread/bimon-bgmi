/**
 * Game Configuration — single source of truth for game-specific strings.
 * Everything that differs between BGMI, Free Fire, and PES lives here.
 * Usage: import { GAME } from "@/lib/game-config";
 *        then use GAME.currency, GAME.passName, etc.
 */

export type GameMode = "bgmi" | "freefire" | "pes";

interface GameConfig {
    mode: GameMode;
    name: string;                // App/brand name
    fullName: string;            // Full display name
    gameName: string;            // Actual game name
    currency: string;            // "UC" or "Diamonds" or "Coins"
    currencyLabel: string;       // Compact inline label
    currencyEmoji: string;       // Emoji for currency
    currencyPlural: string;      // Plural form
    passName: string;            // "Royal Pass" or "Elite Pass"
    passEmoji: string;           // "👑"
    idLabel: string;             // "BGMI ID" or "PES ID"
    idPlaceholder: string;       // placeholder text for ID input
    hasUID: boolean;             // whether the game uses a separate UID field
    // Scoring
    scoringSystem: "bgmi" | "ffws" | "bracket";
    booyahBonus: boolean;        // Free Fire has Booyah (1st place bonus)
    // Tournament type
    defaultTournamentType: "BR" | "BRACKET_1V1";
    hasBracket: boolean;         // whether this game supports bracket tournaments
    hasBR: boolean;              // whether this game supports BR tournaments
}

const GAME_CONFIGS: Record<GameMode, GameConfig> = {
    bgmi: {
        mode: "bgmi",
        name: "PUBGMI",
        fullName: "PUBG Mobile India Tournament Platform",
        gameName: "BGMI",
        currency: "UC",
        currencyLabel: "UC",
        currencyEmoji: "💰",
        currencyPlural: "UC",
        passName: "Royal Pass",
        passEmoji: "👑",
        idLabel: "BGMI ID",
        idPlaceholder: "Your BGMI character ID",
        hasUID: false,
        scoringSystem: "bgmi",
        booyahBonus: false,
        defaultTournamentType: "BR",
        hasBracket: false,
        hasBR: true,
    },
    freefire: {
        mode: "freefire",
        name: "BOO-YAH",
        fullName: "Free Fire Tournament Platform",
        gameName: "Free Fire",
        currency: "Diamonds",
        currencyLabel: "💎",
        currencyEmoji: "💎",
        currencyPlural: "Diamonds",
        passName: "Elite Pass",
        passEmoji: "👑",
        idLabel: "Free Fire UID",
        idPlaceholder: "Your Free Fire UID (numeric)",
        hasUID: true,
        scoringSystem: "ffws",
        booyahBonus: true,
        defaultTournamentType: "BR",
        hasBracket: false,
        hasBR: true,
    },
    pes: {
        mode: "pes",
        name: "KICKOFF",
        fullName: "eFootball Tournament Platform",
        gameName: "eFootball (PES)",
        currency: "Coins",
        currencyLabel: "🪙",
        currencyEmoji: "🪙",
        currencyPlural: "Coins",
        passName: "Season Pass",
        passEmoji: "⚽",
        idLabel: "eFootball ID",
        idPlaceholder: "Your eFootball / Konami ID",
        hasUID: false,
        scoringSystem: "bracket",
        booyahBonus: false,
        defaultTournamentType: "BRACKET_1V1",
        hasBracket: true,
        hasBR: false,
    },
};

/**
 * Current game config — reads from NEXT_PUBLIC_GAME_MODE env var.
 * Defaults to "bgmi" if not set (safe for existing BGMI deployment).
 */
export const GAME_MODE: GameMode = (process.env.NEXT_PUBLIC_GAME_MODE as GameMode) || "bgmi";
export const GAME: GameConfig = GAME_CONFIGS[GAME_MODE];
