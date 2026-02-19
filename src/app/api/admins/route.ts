import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/admins
 * Fetches admin and super admin users.
 * Only accessible by super admins.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const admins = await prisma.user.findMany({
            where: {
                role: { in: ["ADMIN", "SUPER_ADMIN"] },
            },
            select: {
                id: true,
                username: true,
                email: true,
                imageUrl: true,
                role: true,
                createdAt: true,
            },
            orderBy: [
                { role: "asc" }, // SUPER_ADMIN first
                { createdAt: "asc" },
            ],
        });

        return SuccessResponse({ data: admins, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch admins", error });
    }
}
