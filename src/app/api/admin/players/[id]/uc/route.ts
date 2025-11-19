import { getPlayerById } from "@/src/services/player/getPlayerById";
import { updatePlayerUc } from "@/src/services/player/updatePlayerUc";
import { getUniqueUc } from "@/src/services/uc/getPlayerUc";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import z from "zod";

const ucSchema = z.object({
  type: z.enum(["credit", "debit"]),
  amount: z.coerce.number(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await superAdminMiddleware(req);
    const playerId = (await params).id;
    const body = ucSchema.parse(await req.json());
    const isPlayerExist = await getPlayerById({ id: playerId });

    if (!isPlayerExist) {
      return ErrorResponse({
        message: "Player not found",
        status: 404,
      });
    }
    const updatedUc = await updatePlayerUc({
      where: { playerId },
      data: {
        balance: body.type === "credit" ? body.amount : -body.amount,
        player: { connect: { id: playerId } },
        user: {
          connect: { id: isPlayerExist.user.id },
        },
      },
      update: {
        balance:
          body.type === "credit"
            ? { increment: body.amount }
            : { decrement: body.amount },
      },
    });
    return SuccessResponse({
      data: updatedUc,
      status: 200,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
