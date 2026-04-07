import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

/**
 * GET /api/locations?level=states|districts|towns&stateId=...&districtId=...
 * Returns location options from DB tables for the given level.
 * Used in the location modal and players page filter chips.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const level = searchParams.get("level") ?? "states";
        const stateId = searchParams.get("stateId");
        const districtId = searchParams.get("districtId");

        if (level === "states") {
            const states = await prisma.locationState.findMany({
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            });
            return SuccessResponse({ data: states });
        }

        if (level === "districts" && stateId) {
            const districts = await prisma.locationDistrict.findMany({
                where: { stateId },
                orderBy: { name: "asc" },
                select: { id: true, name: true },
            });
            return SuccessResponse({ data: districts });
        }

        if (level === "towns" && districtId) {
            const towns = await prisma.locationTown.findMany({
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
