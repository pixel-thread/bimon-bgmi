/**
 * Game Configuration — single source of truth for game-specific strings.
 * Everything that differs between BGMI, Free Fire, and PES lives here.
 *
 * To add a new game:
 *   1. Add entry to GameMode union type
 *   2. Add config object to GAME_CONFIGS
 *   3. Create new Vercel project with NEXT_PUBLIC_GAME_MODE=<mode>
 *   4. Create new Supabase DB & push schema
 *   That's it — all UI adapts automatically via feature flags.
 *
 * Usage: import { GAME } from "@/lib/game-config";
 *        then use GAME.currency, GAME.passName, GAME.features.hasTeamSizes, etc.
 */

export type GameMode = "bgmi" | "freefire" | "pes";

/** Feature flags — control which UI sections & features are enabled per game */
interface GameFeatures {
    hasTeamSizes: boolean;       // BR team composition (SOLO/DUO/TRIO/SQUAD)
    hasLuckyVoters: boolean;     // Random voter reward system
    hasRoyalPass: boolean;       // Premium pass + streak rewards
    hasMerit: boolean;           // Merit rating system
    hasReferrals: boolean;       // Referral reward program
    hasTopUps: boolean;          // In-app currency purchases
    hasBracket: boolean;         // 1v1 bracket tournaments
    hasBR: boolean;              // Battle Royale tournaments
}

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
    /** @deprecated Use features.hasBracket instead */
    hasBracket: boolean;
    /** @deprecated Use features.hasBR instead */
    hasBR: boolean;
    // Feature flags
    features: GameFeatures;
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
        features: {
            hasTeamSizes: true,
            hasLuckyVoters: true,
            hasRoyalPass: true,
            hasMerit: true,
            hasReferrals: true,
            hasTopUps: true,
            hasBracket: false,
            hasBR: true,
        },
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
        features: {
            hasTeamSizes: true,
            hasLuckyVoters: true,
            hasRoyalPass: true,
            hasMerit: true,
            hasReferrals: true,
            hasTopUps: true,
            hasBracket: false,
            hasBR: true,
        },
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
        features: {
            hasTeamSizes: false,       // PES is 1v1 only
            hasLuckyVoters: false,      // Not applicable for 1v1
            hasRoyalPass: false,        // No pass system for PES
            hasMerit: false,            // No merit rating for 1v1
            hasReferrals: true,         // Referrals still make sense
            hasTopUps: true,            // Currency purchases still apply
            hasBracket: true,
            hasBR: false,
        },
    },
};

/**
 * Current game config — reads from NEXT_PUBLIC_GAME_MODE env var.
 * Defaults to "bgmi" if not set (safe for existing BGMI deployment).
 */
export const GAME_MODE: GameMode = (process.env.NEXT_PUBLIC_GAME_MODE as GameMode) || "bgmi";
export const GAME: GameConfig = GAME_CONFIGS[GAME_MODE];
