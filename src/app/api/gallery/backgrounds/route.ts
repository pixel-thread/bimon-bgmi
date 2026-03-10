import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/database";

/**
 * GET /api/gallery/backgrounds — List all bracket background images.
 * Public — used by the bracket page.
 */
export async function GET() {
    try {
        const items = await prisma.gallery.findMany({
            where: { status: "ACTIVE", isGlobalBackground: true },
            select: { id: true, name: true, publicUrl: true },
            orderBy: { name: "asc" },
        });
        return SuccessResponse({ data: items, cache: CACHE.LONG });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch backgrounds", error });
    }
}

/**
 * POST /api/gallery/backgrounds — Add a bracket background image.
 * Admin or Super Admin only.
 * Expects JSON: { url: string, label?: string }
 */
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const { url, label } = await request.json();
        if (!url) {
            return ErrorResponse({ message: "Image URL is required", status: 400 });
        }

        const image = await prisma.gallery.create({
            data: {
                imageId: `bg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                name: label || "Bracket Background",
                path: url,
                fullPath: url,
                publicUrl: url,
                isGlobalBackground: true,
                status: "ACTIVE",
            },
        });

        return SuccessResponse({ data: image, message: "Background added!" });
    } catch (error) {
        return ErrorResponse({ message: "Failed to add background", error });
    }
}

/**
 * DELETE /api/gallery/backgrounds — Remove a bracket background image.
 * Admin or Super Admin only.
 * Expects JSON: { id: string }
 */
export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const { id } = await request.json();
        if (!id) return ErrorResponse({ message: "ID required", status: 400 });

        await prisma.gallery.delete({ where: { id } });
        return SuccessResponse({ message: "Background removed!" });
    } catch (error) {
        return ErrorResponse({ message: "Failed to delete background", error });
    }
}
