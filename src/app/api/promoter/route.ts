import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import z from "zod";

const enablePromoterSchema = z.object({
    referralCode: z
        .string()
        .min(3, "Code must be at least 3 characters")
        .max(20, "Code must be at most 20 characters")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Code can only contain letters, numbers, underscores and dashes"
        )
        .transform((val) => val.toLowerCase()),
});

/**
 * GET /api/promoter - Get current user's promoter status and dashboard data
 */
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Get user with promoter data
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            select: {
                isPromoter: true,
                referralCode: true,
                promoterEarnings: true,
            },
        });

        if (!userData) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        // If not a promoter, return minimal data
        if (!userData.isPromoter) {
            return SuccessResponse({
                data: {
                    isPromoter: false,
                    referralCode: null,
                    promoterEarnings: 0,
                    referralStats: {
                        totalSignups: 0,
                        pendingCount: 0,
                        qualifiedCount: 0,
                        paidCount: 0,
                    },
                    referrals: [],
                },
            });
        }

        // Get referral stats
        const referrals = await prisma.referral.findMany({
            where: { promoterId: user.id },
            include: {
                referredPlayer: {
                    include: {
                        user: { select: { displayName: true, userName: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const stats = {
            totalSignups: referrals.length,
            pendingCount: referrals.filter((r) => r.status === "PENDING").length,
            qualifiedCount: referrals.filter((r) => r.status === "QUALIFIED").length,
            paidCount: referrals.filter((r) => r.status === "PAID").length,
        };

        const referralData = referrals.map((r) => ({
            id: r.id,
            playerName:
                r.referredPlayer.user.displayName || r.referredPlayer.user.userName,
            tournamentsCompleted: r.tournamentsCompleted,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
        }));

        return SuccessResponse({
            data: {
                isPromoter: userData.isPromoter,
                referralCode: userData.referralCode,
                promoterEarnings: userData.promoterEarnings,
                referralStats: stats,
                referrals: referralData,
            },
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

/**
 * POST /api/promoter - Enable promoter mode using username as referral code
 */
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Get user data including username
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isPromoter: true, userName: true },
        });

        if (!existingUser) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        if (existingUser.isPromoter) {
            return ErrorResponse({
                message: "You are already a promoter",
                status: 400,
            });
        }

        // Use username as referral code (lowercase)
        const referralCode = existingUser.userName.toLowerCase();

        // Check if code is already taken (shouldn't happen since usernames are unique, but just in case)
        const existingCode = await prisma.user.findFirst({
            where: {
                referralCode,
                id: { not: user.id }
            },
        });

        if (existingCode) {
            return ErrorResponse({
                message: "Referral code conflict. Please contact support.",
                status: 409,
            });
        }

        // Enable promoter mode with username as referral code
        await prisma.user.update({
            where: { id: user.id },
            data: {
                isPromoter: true,
                referralCode,
            },
        });

        return SuccessResponse({
            message: "Promoter mode enabled! Start sharing your referral link.",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

/**
 * PATCH /api/promoter - Update referral code
 */
export async function PATCH(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        // Check if user is a promoter
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { isPromoter: true },
        });

        if (!existingUser?.isPromoter) {
            return ErrorResponse({
                message: "You are not a promoter",
                status: 400,
            });
        }

        const body = await req.json();
        const { referralCode } = enablePromoterSchema.parse(body);

        // Check if new code is already taken (by someone else)
        const existingCode = await prisma.user.findUnique({
            where: { referralCode },
        });

        if (existingCode && existingCode.id !== user.id) {
            return ErrorResponse({
                message: "This referral code is already taken. Please choose another.",
                status: 409,
            });
        }

        // Update code
        await prisma.user.update({
            where: { id: user.id },
            data: { referralCode },
        });

        return SuccessResponse({
            message: "Referral code updated!",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
