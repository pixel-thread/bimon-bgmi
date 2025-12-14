import { getRecentMatchGroups } from "@/src/services/recentMatches/getRecentMatchGroups";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

// User-facing API - requires login
export async function GET(req: Request) {
    try {
        await tokenMiddleware(req);
        const groups = await getRecentMatchGroups();
        return SuccessResponse({ data: groups });
    } catch (error) {
        return handleApiErrors(error);
    }
}
