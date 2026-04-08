import { prisma } from "@/lib/database";
import { getAuthEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/locations/players?state=...&district=...&town=...
 * Returns players at a specific location level.
 */
export async function GET(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const user = await prisma.user.findFirst({
            where: { OR: [{ email }, { secondaryEmail: email }] },
            select: { role: true },
        });
        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const state = searchParams.get("state");
        const district = searchParams.get("district");
        const town = searchParams.get("town");

        if (!state) {
            return ErrorResponse({ message: "state is required", status: 400 });
        }

        const where: Record<string, string> = { state };
        if (district) where.district = district;
        if (town) where.town = town;

        const players = await prisma.player.findMany({
            where,
            select: {
                id: true,
                displayName: true,
                state: true,
                district: true,
                town: true,
                user: { select: { imageUrl: true } },
            },
            orderBy: { displayName: "asc" },
            take: 50,
        });

        return SuccessResponse({
            data: players.map((p) => ({
                id: p.id,
                name: p.displayName,
                town: p.town,
                district: p.district,
                state: p.state,
                avatar: p.user?.imageUrl,
            })),
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch players", error });
    }
}
