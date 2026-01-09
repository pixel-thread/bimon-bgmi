import { getMyJobListings } from "@/src/services/jobListing/getMyJobListings";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";

// GET - Get current player's job listings
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const listings = await getMyJobListings(player.id);

        return SuccessResponse({
            data: listings,
            message: "Your job listings fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
