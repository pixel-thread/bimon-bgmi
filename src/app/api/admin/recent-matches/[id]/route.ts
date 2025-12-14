import { deleteRecentMatchGroup } from "@/src/services/recentMatches/deleteRecentMatchGroup";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await adminMiddleware(req);
        const id = (await params).id;

        if (!id) {
            return ErrorResponse({ message: "Group ID is required", status: 400 });
        }

        await deleteRecentMatchGroup(id);

        return SuccessResponse({
            message: "Scoreboard group deleted successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
