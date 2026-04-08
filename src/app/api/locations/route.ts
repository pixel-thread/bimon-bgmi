import { communityDb } from "@/lib/community-db";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

/**
 * GET /api/locations?level=states|districts|towns&stateId=...&districtId=...
 * Returns location options from the CENTRAL DB tables.
 * Shared across all game deployments.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const level = searchParams.get("level") ?? "states";
        const stateId = searchParams.get("stateId");
        const districtId = searchParams.get("districtId");

        if (level === "states") {
            const states = await communityDb.centralLocationState.findMany({
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            });
            return SuccessResponse({ data: states });
        }

        if (level === "districts" && stateId) {
            const districts = await communityDb.centralLocationDistrict.findMany({
                where: { stateId },
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            });
            return SuccessResponse({ data: districts });
        }

        if (level === "towns" && districtId) {
            const towns = await communityDb.centralLocationTown.findMany({
                where: { districtId },
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            });
            return SuccessResponse({ data: towns });
        }

        return ErrorResponse({ message: "Invalid params", status: 400 });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch locations", error });
    }
}
