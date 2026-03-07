import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getSettings } from "@/lib/settings";
import { GAME, GAME_MODE } from "@/lib/game-config";

/**
 * GET /api/settings/public
 * Returns public-facing settings (no auth required).
 * Only exposes fields safe for the frontend.
 */
export async function GET() {
    try {
        const settings = await getSettings();

        return SuccessResponse({
            data: {
                // Game identity
                gameMode: GAME_MODE,
                gameName: GAME.gameName,
                appName: GAME.name,
                currency: GAME.currency,
                currencyEmoji: GAME.currencyEmoji,
                passName: GAME.passName,
                // Feature flags & values
                orgCutPercent: settings.orgCutPercent,
                enableTopUps: settings.enableTopUps,
                enableElitePass: settings.enableElitePass,
                elitePassPrice: settings.elitePassPrice,
                elitePassOrigPrice: settings.elitePassOrigPrice,
                enableReferrals: settings.enableReferrals,
                referralReward: settings.referralReward,
                referralTournamentsReq: settings.referralTournamentsReq,
                enableLuckyVoters: settings.enableLuckyVoters,
                allowedTeamSizes: settings.allowedTeamSizes,
                maxIGNLength: settings.maxIGNLength,
                defaultPollDays: settings.defaultPollDays,
                defaultEntryFee: settings.defaultEntryFee,
                streakMilestone: settings.streakMilestone,
                streakRewardAmount: settings.streakRewardAmount,
                whatsAppGroups: settings.whatsAppGroups,
                welcomeMessage: settings.welcomeMessage,
                customRules: settings.customRules,
            },
            cache: CACHE.LONG,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch settings", error });
    }
}
