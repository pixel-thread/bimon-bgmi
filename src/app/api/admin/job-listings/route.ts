import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";

// GET - Get all job listings for admin (includes banned)
export async function GET(req: NextRequest) {
    try {
        await adminMiddleware(req);

        const filter = req.nextUrl.searchParams.get("filter") || "all";

        let where = {};
        if (filter === "banned") {
            where = { isJobBanned: true };
        } else if (filter === "active") {
            where = { isActive: true, isJobBanned: false };
        }

        const listings = await prisma.playerJobListing.findMany({
            where,
            include: {
                player: {
                    select: {
                        id: true,
                        customProfileImageUrl: true,
                        user: {
                            select: {
                                userName: true,
                                displayName: true,
                            },
                        },
                        characterImage: {
                            select: { publicUrl: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return SuccessResponse({
            data: listings,
            message: "Job listings fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
