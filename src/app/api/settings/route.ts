import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";

/**
 * GET /api/settings — Fetch current app settings.
 * SUPER_ADMIN only.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const settings = await getSettings();
        return SuccessResponse({ data: settings });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch settings", error });
    }
}

/**
 * PUT /api/settings — Update app settings.
 * SUPER_ADMIN only. Accepts partial updates.
 */
export async function PUT(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const body = await request.json();
        const updated = await saveSettings(body);

        return SuccessResponse({
            data: updated,
            message: "Settings updated successfully",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update settings", error });
    }
}
