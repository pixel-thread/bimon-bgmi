import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/seasons — Fetch all seasons.
 */
export async function GET() {
    try {
        const seasons = await prisma.season.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
                endDate: true,
                createdAt: true,
            },
        });

        const data = seasons.map((s) => ({
            ...s,
            isCurrent: s.status === "ACTIVE",
        }));

        const response = NextResponse.json({ success: true, data });
        response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=1800");
        return response;
    } catch (error) {
        console.error("Error fetching seasons:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

/**
 * POST /api/seasons — Create a new season (admin only).
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Deactivate any current active season
        await prisma.season.updateMany({
            where: { status: "ACTIVE" },
            data: { status: "INACTIVE" },
        });

        const season = await prisma.season.create({
            data: {
                name: name.trim(),
                startDate: new Date(),
                status: "ACTIVE",
                createdBy: user.id,
            },
        });

        return NextResponse.json({ success: true, data: season });
    } catch (error) {
        console.error("Error creating season:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
