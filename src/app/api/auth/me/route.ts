import { getCurrentUser } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";

/**
 * GET /api/auth/me
 * Returns the current authenticated user with their player + wallet data.
 * Used by the client-side useAuthUser() hook.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ErrorResponse({ message: "Not authenticated", status: 401 });
        }
        return SuccessResponse({ data: user });
    } catch {
        return ErrorResponse({ message: "Failed to fetch user" });
    }
}
