import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db/prisma";

/**
 * GET /api/admin/settings
 * Get app settings (optional ?key= filter)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
            select: { role: true },
        });

        if (!dbUser || (dbUser.role !== "ADMIN" && dbUser.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");

        if (key) {
            const setting = await prisma.appSetting.findUnique({
                where: { key },
            });
            return NextResponse.json({
                data: setting ? { [key]: setting.value } : { [key]: null },
            });
        }

        const settings = await prisma.appSetting.findMany();
        const settingsMap = settings.reduce((acc: Record<string, string>, s: { key: string; value: string }) => {
            acc[s.key] = s.value;
            return acc;
        }, {} as Record<string, string>);

        return NextResponse.json({ data: settingsMap });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/settings
 * Update an app setting (super admin only)
 */
export async function PATCH(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { clerkId: user.id },
            select: { role: true },
        });

        // Only SUPER_ADMIN can modify settings
        if (!dbUser || dbUser.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Super admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: "Key and value required" }, { status: 400 });
        }

        await prisma.appSetting.upsert({
            where: { key },
            create: { key, value: String(value) },
            update: { value: String(value) },
        });

        return NextResponse.json({ message: "Setting updated", data: { [key]: value } });
    } catch (error) {
        console.error("Error updating setting:", error);
        return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }
}
