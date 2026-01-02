import { deleteTeamById } from "@/src/services/team/deleteTeamById";
import { getTeamById } from "@/src/services/team/getTeamById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { prisma } from "@/src/lib/db/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await adminMiddleware(req);

    const id = (await params).id;

    const team = await getTeamById({
      where: { id },
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
    await adminMiddleware(req);
    const id = (await params).id;

    // Check for refund query param
    const url = new URL(req.url);
    const refund = url.searchParams.get("refund") === "true";

    const isTeamExist = await getTeamById({ where: { id } });

    if (!isTeamExist) {
      return ErrorResponse({
        message: "Team does not exist",
        status: 404,
      });
    }

    // Get tournament info for refund
    const tournament = await prisma.tournament.findUnique({
      where: { id: isTeamExist.tournamentId || "" },
      select: { name: true, fee: true },
    });

    const result = await deleteTeamById({
      id,
      refund,
      tournamentName: tournament?.name,
      entryFee: tournament?.fee || 0,
    });

    let message = "Team deleted successfully";
    if (result.refundedCount > 0) {
      message += `. ${result.refundedAmount} UC refunded to ${result.refundedCount} player(s)`;
    }

    return SuccessResponse({
      data: result,
      message,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}

