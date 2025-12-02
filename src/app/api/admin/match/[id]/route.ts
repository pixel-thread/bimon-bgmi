import { deleteMatch } from "@/src/services/match/deleteMatch";
import { getUniqueMatch } from "@/src/services/match/getMatchById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const id = (await params).id;
    const match = await getUniqueMatch({ where: { id } });

    if (!match) {
      return ErrorResponse({
        message: "Match not found",
        status: 404,
      });
    }

    const deletedMatch = await deleteMatch({ where: { id } });

    return SuccessResponse({
      message: "Match deleted successfully",
      data: deletedMatch,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
