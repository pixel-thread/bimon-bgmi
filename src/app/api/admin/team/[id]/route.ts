import { deleteTeamById } from "@/src/services/team/deleteTeamById";
import { getTeamById } from "@/src/services/team/getTeamById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);

    const id = (await params).id;

    const team = await getTeamById({
      where: { id },
      include: { players: true, matches: true },
    });

    if (!team) {
      return ErrorResponse({ message: "Team not found" });
    }

    return SuccessResponse({
      data: team,
      message: "Team fetched successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const id = (await params).id;
    const isTeamExist = await getTeamById({ where: { id } });

    if (!isTeamExist) {
      return ErrorResponse({
        message: "Team does not exist",
        status: 404,
      });
    }

    const deletedTeam = await deleteTeamById({ id });

    return SuccessResponse({
      data: deletedTeam,
      message: "Team deleted successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
