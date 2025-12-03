import { getUniqueMatch } from "@/src/services/match/getMatchById";
import { updateManyTeamsStats } from "@/src/services/team/updateTeamStats";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { teamStatsSchema } from "@/src/utils/validation/team/team-stats";
import { NextRequest } from "next/server";
import z from "zod";

const bulkStatsSchema = z.object({
    stats: z.array(teamStatsSchema),
});

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        await adminMiddleware(req);
        const matchId = (await params).id;

        const isMatchExist = await getUniqueMatch({ where: { id: matchId } });

        if (!isMatchExist) {
            return ErrorResponse({
                message: "Match not found",
                status: 404,
            });
        }

        const body = bulkStatsSchema.parse(await req.json());

        await updateManyTeamsStats({
            stats: body.stats,
            matchId,
            tournamentId: isMatchExist.tournamentId,
            seasonId: isMatchExist.seasonId,
        });

        return SuccessResponse({
            message: "Bulk stats updated successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
