import { ErrorResponse } from "@/lib/api-response";
import { GAME } from "@/lib/game-config";

/**
 * POST /api/squads/invite
 * Direct captain invites are disabled.
 * Players must request to join squads via /api/squads/request-join.
 */
export async function POST() {
    if (!GAME.features.hasSquads) {
        return ErrorResponse({ message: "Squads are not available for this game", status: 400 });
    }

    return ErrorResponse({
        message: "Direct invites are disabled. Players can request to join your squad from the View Teams page.",
        status: 403,
    });
}
