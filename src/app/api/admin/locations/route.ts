import { prisma } from "@/lib/database";
import { getAuthEmail } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

/**
 * GET /api/admin/locations
 * Returns all states with their districts, towns, and player counts.
 */
export async function GET() {
    try {
        const email = await getAuthEmail();
        if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

        // Check admin
        const user = await prisma.user.findFirst({
            where: { OR: [{ email }, { secondaryEmail: email }] },
            select: { role: true },
        });
        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        // Get all states with full hierarchy and player counts
        const states = await prisma.locationState.findMany({
            orderBy: { name: "asc" },
            include: {
                districts: {
                    orderBy: { name: "asc" },
                    include: {
                        towns: { orderBy: { name: "asc" } },
                    },
                },
            },
        });

        // Get player counts per state/district/town
        const playerCounts = await prisma.player.groupBy({
            by: ["state", "district", "town"],
            _count: true,
            where: { state: { not: null } },
        });

        // Build a lookup map
        const countMap: Record<string, number> = {};
        for (const p of playerCounts) {
            const stateKey = p.state || "";
            const districtKey = `${stateKey}|${p.district || ""}`;
            const townKey = `${districtKey}|${p.town || ""}`;
            countMap[stateKey] = (countMap[stateKey] || 0) + p._count;
            countMap[districtKey] = (countMap[districtKey] || 0) + p._count;
            countMap[townKey] = (countMap[townKey] || 0) + p._count;
        }

        const data = states.map((s) => ({
            id: s.id,
            name: s.name,
            playerCount: countMap[s.name] || 0,
            districts: s.districts.map((d) => ({
                id: d.id,
                name: d.name,
                playerCount: countMap[`${s.name}|${d.name}`] || 0,
                towns: d.towns.map((t) => ({
                    id: t.id,
                    name: t.name,
                    playerCount: countMap[`${s.name}|${d.name}|${t.name}`] || 0,
                })),
            })),
        }));

        return SuccessResponse({ data });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch locations", error });
    }
}

/**
 * DELETE /api/admin/locations
 * Delete a location entry (state, district, or town).
 * Resets any players who had that location.
 */
export async function DELETE(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const user = await prisma.user.findFirst({
            where: { OR: [{ email }, { secondaryEmail: email }] },
            select: { role: true },
        });
        if (!user || user.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Super admin only", status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const level = searchParams.get("level"); // state | district | town
        const id = searchParams.get("id");
        const name = searchParams.get("name");

        if (!level || !id) {
            return ErrorResponse({ message: "level and id required", status: 400 });
        }

        if (level === "state") {
            // Reset players with this state
            const state = await prisma.locationState.findUnique({ where: { id }, select: { name: true } });
            if (state) {
                const resetResult = await prisma.player.updateMany({
                    where: { state: state.name },
                    data: { state: null, district: null, town: null },
                });
                // Delete cascades to districts and towns
                await prisma.locationState.delete({ where: { id } });
                return SuccessResponse({
                    message: `Deleted state "${state.name}" and reset ${resetResult.count} player(s)`,
                });
            }
        } else if (level === "district") {
            const district = await prisma.locationDistrict.findUnique({
                where: { id },
                include: { state: { select: { name: true } } },
            });
            if (district) {
                const resetResult = await prisma.player.updateMany({
                    where: { state: district.state.name, district: district.name },
                    data: { state: null, district: null, town: null },
                });
                await prisma.locationDistrict.delete({ where: { id } });
                return SuccessResponse({
                    message: `Deleted district "${district.name}" and reset ${resetResult.count} player(s)`,
                });
            }
        } else if (level === "town") {
            const town = await prisma.locationTown.findUnique({
                where: { id },
                include: { district: { include: { state: { select: { name: true } } } } },
            });
            if (town) {
                const resetResult = await prisma.player.updateMany({
                    where: {
                        state: town.district.state.name,
                        district: town.district.name,
                        town: town.name,
                    },
                    data: { state: null, district: null, town: null },
                });
                await prisma.locationTown.delete({ where: { id } });
                return SuccessResponse({
                    message: `Deleted town "${town.name}" and reset ${resetResult.count} player(s)`,
                });
            }
        }

        return ErrorResponse({ message: "Not found", status: 404 });
    } catch (error) {
        return ErrorResponse({ message: "Failed to delete location", error });
    }
}

/**
 * POST /api/admin/locations
 * Add a new state or district (towns are user-creatable).
 */
export async function POST(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const user = await prisma.user.findFirst({
            where: { OR: [{ email }, { secondaryEmail: email }] },
            select: { role: true },
        });
        if (!user || user.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Super admin only", status: 403 });
        }

        const body = await req.json();
        const { level, name, parentId } = body as {
            level: "state" | "district";
            name: string;
            parentId?: string;
        };

        if (!name?.trim()) {
            return ErrorResponse({ message: "Name is required", status: 400 });
        }

        if (level === "state") {
            const existing = await prisma.locationState.findUnique({ where: { name: name.trim() } });
            if (existing) return ErrorResponse({ message: "State already exists", status: 409 });
            await prisma.locationState.create({ data: { name: name.trim() } });
            return SuccessResponse({ message: `State "${name.trim()}" created` });
        } else if (level === "district" && parentId) {
            const existing = await prisma.locationDistrict.findUnique({
                where: { name_stateId: { name: name.trim(), stateId: parentId } },
            });
            if (existing) return ErrorResponse({ message: "District already exists in this state", status: 409 });
            await prisma.locationDistrict.create({ data: { name: name.trim(), stateId: parentId } });
            return SuccessResponse({ message: `District "${name.trim()}" created` });
        }

        return ErrorResponse({ message: "Invalid params", status: 400 });
    } catch (error) {
        return ErrorResponse({ message: "Failed to create location", error });
    }
}
