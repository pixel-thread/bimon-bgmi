/**
 * Game Configuration — single source of truth for game-specific strings.
 * Everything that differs between BGMI, Free Fire, and PES lives here.
 *
 * To add a new game:
 *   1. Add entry to GameMode union type
 *   2. Add config object to GAME_CONFIGS
 *   3. Add domain mapping in proxy.ts DOMAIN_GAME_MAP
 *   4. Add DATABASE_URL_<GAME> env var in Vercel
 *   5. Add domain to Vercel project settings
 *   6. Create Supabase DB & push schema
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
    hasBracket: boolean;         // 1v1 bracket tournaments (knockout)
    hasBR: boolean;              // Battle Royale tournaments
    hasLeague: boolean;          // Round-robin league format
    hasGroupKnockout: boolean;   // Group stage → knockout (World Cup style)
    usesCentralWallet: boolean;  // Shared B-Coin wallet across games (false = fully isolated)
}

interface GameConfig {
    mode: GameMode;
    name: string;                // App/brand name
    fullName: string;            // Full display name
    gameName: string;            // Actual game name
    currency: string;            // "UC" or "Diamonds" or "Coins"
    currencyLabel: string;       // Compact inline label
    currencyEmoji: string;       // Emoji for currency
    currencyIconPath?: string;   // Optional PNG path (overrides emoji in UI)
    currencyPlural: string;      // Plural form
    passName: string;            // "Royal Pass" or "Elite Pass"
    passEmoji: string;           // "👑"
    idLabel: string;             // "BGMI ID" or "PES ID"
    idPlaceholder: string;       // e.g. "Your BGMI ID (numeric)"
    hasUID: boolean;             // Whether to show UID field in onboarding
    ignLabel: string;            // UI label for display name: "Game Name" or "Team Name"
    pasteOnlyIGN: boolean;       // Whether game name must be pasted (BGMI) or can be typed (PES/FF)
    locale: "kha" | "en";        // UI language: "kha" = Khasi, "en" = English
    scoringSystem: string;       // "bgmi" | "ffws" | "bracket"
    booyahBonus: boolean;        // FFWS/Booyah bonus points
    defaultTournamentType: string; // "BR" | "BRACKET_1V1" | "LEAGUE" | "GROUP_KNOCKOUT"
    tournamentTypes: string[];   // All supported types for this game
    hasBracket: boolean;         // Whether this game supports bracket tournaments
    hasBR: boolean;              // Whether this game supports BR tournaments.
    // Feature flags
    features: GameFeatures;
}

const GAME_CONFIGS: Record<GameMode, GameConfig> = {
    bgmi: {
        mode: "bgmi",
        name: "PUBGMI",
        fullName: "PUBG Mobile India Tournament Platform",
        gameName: "BGMI",
        currency: "B-Coin",
        currencyLabel: "B-Coin",
        currencyEmoji: "🪙",
        currencyIconPath: "/images/coin.png",
        currencyPlural: "B-Coins",
        passName: "Royal Pass",
        passEmoji: "👑",
        idLabel: "BGMI ID",
        idPlaceholder: "Your BGMI character ID",
        hasUID: false,
        ignLabel: "Game Name",
        pasteOnlyIGN: true,          // BGMI requires paste to prevent fake names
        locale: "kha",
        scoringSystem: "bgmi",
        booyahBonus: false,
        defaultTournamentType: "BR",
        tournamentTypes: ["BR"],
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
            hasLeague: false,
            hasGroupKnockout: false,
            usesCentralWallet: false,  // All games use local wallet now
        },
    },
    freefire: {
        mode: "freefire",
        name: "BOOYAH",
        fullName: "Free Fire Tournament Platform",
        gameName: "Free Fire",
        currency: "B-Coin",
        currencyLabel: "B-Coin",
        currencyEmoji: "🪙",
        currencyIconPath: "/images/coin.png",
        currencyPlural: "B-Coins",
        passName: "Elite Pass",
        passEmoji: "👑",
        idLabel: "Free Fire UID",
        idPlaceholder: "Your Free Fire UID (numeric)",
        hasUID: true,
        ignLabel: "Game Name",
        pasteOnlyIGN: false,         // FF players can type their name
        locale: "kha",
        scoringSystem: "ffws",
        booyahBonus: true,
        defaultTournamentType: "BR",
        tournamentTypes: ["BR"],
        hasBracket: false,
        hasBR: true,
        features: {
            hasTeamSizes: true,
            hasLuckyVoters: true,
            hasRoyalPass: true,
            hasMerit: true,
            hasReferrals: true,
            hasTopUps: false,            // Razorpay not configured for Free Fire yet
            hasBracket: false,
            hasBR: true,
            hasLeague: false,
            hasGroupKnockout: false,
            usesCentralWallet: false,  // Free Fire is managed separately — fully isolated wallet
        },
    },
    pes: {
        mode: "pes",
        name: "KICKOFF",
        fullName: "eFootball Tournament Platform",
        gameName: "eFootball (PES)",
        currency: "B-Coin",
        currencyLabel: "B-Coin",
        currencyEmoji: "🪙",
        currencyIconPath: "/images/coin.png",
        currencyPlural: "B-Coins",
        passName: "Season Pass",
        passEmoji: "⚽",
        idLabel: "eFootball ID",
        idPlaceholder: "Your eFootball / Konami ID",
        hasUID: false,
        ignLabel: "Team Name",
        pasteOnlyIGN: false,         // PES players can type any name
        locale: "en",
        scoringSystem: "bracket",
        booyahBonus: false,
        defaultTournamentType: "GROUP_KNOCKOUT",
        tournamentTypes: ["BRACKET_1V1", "LEAGUE", "GROUP_KNOCKOUT"],
        hasBracket: true,
        hasBR: false,
        features: {
            hasTeamSizes: false,       // PES is 1v1 only
            hasLuckyVoters: true,       // Lucky voter draws work for any tournament
            hasRoyalPass: false,        // No pass system for PES
            hasMerit: false,            // No merit rating for 1v1
            hasReferrals: true,         // Referrals still make sense
            hasTopUps: false,            // Razorpay not configured for Free Fire yet
            hasBracket: true,
            hasBR: false,
            hasLeague: true,            // Round-robin league
            hasGroupKnockout: true,     // Group → Knockout (World Cup)
            usesCentralWallet: false,  // All games use local wallet now
        },
    },
};

/**
 * Current game config — reads game mode at runtime.
 *
 * Priority:
 *   1. Cookie "game-mode" (set by proxy.ts from domain detection)
 *   2. Env var NEXT_PUBLIC_GAME_MODE (local dev fallback)
 *   3. Default "bgmi"
 *
 * This allows a single deployment to serve all games via domain detection.
 */
function resolveGameMode(): GameMode {
    // Client-side: read from cookie (set by proxy)
    if (typeof window !== "undefined") {
        const match = document.cookie.match(/(?:^|;\s*)game-mode=(\w+)/);
        if (match && match[1] in GAME_CONFIGS) return match[1] as GameMode;
    }

    // Server-side: try to read from headers (set by proxy)
    // Note: headers() is async in Next.js 16, so we use the env fallback for module-level usage
    // API routes and server components should use getGameConfig() for dynamic detection

    // Fallback: env var (for local dev and build time)
    const envMode = process.env.NEXT_PUBLIC_GAME_MODE as GameMode;
    if (envMode && envMode in GAME_CONFIGS) return envMode;

    return "bgmi";
}

export const GAME_MODE: GameMode = resolveGameMode();
export const GAME: GameConfig = GAME_CONFIGS[GAME_MODE];

/**
 * For server-side dynamic detection in API routes:
 *   import { getGameConfig } from "@/lib/game-config";
 *   const { GAME, GAME_MODE } = getGameConfig(request);
 */
export function getGameConfig(request?: Request) {
    const gameMode = (request?.headers.get("x-game-mode") as GameMode) || GAME_MODE;
    return {
        GAME_MODE: gameMode,
        GAME: GAME_CONFIGS[gameMode] || GAME_CONFIGS.bgmi,
    };
}

/** Export configs for direct access if needed */
export { GAME_CONFIGS };
