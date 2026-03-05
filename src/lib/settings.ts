import { prisma } from "@/lib/database";
import { cache } from "react";

const SETTINGS_KEY = "app_settings";

export interface AppSettings {
    // 💰 Financial
    orgCutPercent: number;
    defaultEntryFee: number;
    enableTopUps: boolean;
    nameChangeFee: number;

    // 🏆 Royal Pass
    enableElitePass: boolean;
    elitePassPrice: number;
    elitePassOrigPrice: number;
    streakMilestone: number;
    streakRewardAmount: number;

    // 🎯 Referrals
    enableReferrals: boolean;
    referralReward: number;
    referralTournamentsReq: number;

    // 🍀 Lucky Voters
    enableLuckyVoters: boolean;

    // 🎮 Gameplay
    allowedTeamSizes: string;
    maxIGNLength: number;
    defaultPollDays: number;

    // 📢 Community
    whatsAppGroups: string[];
    welcomeMessage: string;
    customRules: string;

    // 🛡️ Merit System
    meritBanThreshold: number;
    meritSoloRestrictThreshold: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
    orgCutPercent: 10,
    defaultEntryFee: 30,
    enableTopUps: true,
    nameChangeFee: 1,

    enableElitePass: true,
    elitePassPrice: 5,
    elitePassOrigPrice: 20,
    streakMilestone: 8,
    streakRewardAmount: 30,

    enableReferrals: true,
    referralReward: 20,
    referralTournamentsReq: 5,

    enableLuckyVoters: true,

    allowedTeamSizes: "SOLO,DUO,TRIO,SQUAD",
    maxIGNLength: 20,
    defaultPollDays: 3,

    whatsAppGroups: [],
    welcomeMessage: "",
    customRules: "",

    meritBanThreshold: 0,
    meritSoloRestrictThreshold: 0,
};

/**
 * Get the current app settings, merged with defaults.
 * Cached per-request.
 */
export const getSettings = cache(async (): Promise<AppSettings> => {
    const row = await prisma.appConfig.findUnique({
        where: { key: SETTINGS_KEY },
    });

    if (!row) return { ...DEFAULT_SETTINGS };

    try {
        const saved = JSON.parse(row.value);
        return { ...DEFAULT_SETTINGS, ...saved };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
});

/**
 * Save app settings.
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await getSettings();
    const merged = { ...current, ...settings };

    await prisma.appConfig.upsert({
        where: { key: SETTINGS_KEY },
        create: { key: SETTINGS_KEY, value: JSON.stringify(merged) },
        update: { value: JSON.stringify(merged) },
    });

    // Sync merit thresholds to dedicated AppConfig keys (read by rate-merit API)
    if (settings.meritBanThreshold !== undefined || settings.meritSoloRestrictThreshold !== undefined) {
        await Promise.all([
            prisma.appConfig.upsert({
                where: { key: "merit_auto_ban_threshold" },
                create: { key: "merit_auto_ban_threshold", value: String(merged.meritBanThreshold) },
                update: { value: String(merged.meritBanThreshold) },
            }),
            prisma.appConfig.upsert({
                where: { key: "merit_auto_restrict_threshold" },
                create: { key: "merit_auto_restrict_threshold", value: String(merged.meritSoloRestrictThreshold) },
                update: { value: String(merged.meritSoloRestrictThreshold) },
            }),
        ]);
    }

    return merged;
}
