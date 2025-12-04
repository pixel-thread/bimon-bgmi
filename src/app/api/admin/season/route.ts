import { createSeason } from "@/src/services/season/createSeason";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { seasonSchema } from "@/src/utils/validation/seasons";

export async function POST(req: Request) {
  try {
    const user = await superAdminMiddleware(req);
    const body = seasonSchema.parse(await req.json());
    if (!user) {
      throw new Error("Unauthorized");
    }
    const season = await createSeason({
      data: {
        createdBy: user.id,
        name: body.name,
        startDate: body.startDate,
        description: body.description,
      },
    });

    return SuccessResponse({
      data: season,
      message: "Season created successfully",
      status: 201,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
