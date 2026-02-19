import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/income
 * Fetches income records with sub-income breakdowns.
 * Admin-only.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const income = await prisma.income.findMany({
            where: { isSubIncome: false },
            include: {
                children: {
                    select: {
                        id: true,
                        amount: true,
                        description: true,
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        const data = income.map((i) => ({
            id: i.id,
            amount: i.amount,
            description: i.description,
            tournamentName: i.tournamentName,
            isSubIncome: i.isSubIncome,
            createdAt: i.createdAt,
            children: i.children,
        }));

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch income", error });
    }
}
