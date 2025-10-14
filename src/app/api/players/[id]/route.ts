import { getPlayerById } from "@/src/services/player/getPlayerById";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const id = (await params).id;
    const player = await getPlayerById({ id });
    return SuccessResponse({ data: player });
  } catch (error) {
    handleApiErrors(error);
  }
}
