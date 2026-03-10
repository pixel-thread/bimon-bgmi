import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";

/**
 * GET /api/settings — Fetch current app settings.
 * ADMIN or SUPER_ADMIN.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
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
 * ADMIN or SUPER_ADMIN. Accepts partial updates.
 */
export async function PUT(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
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
