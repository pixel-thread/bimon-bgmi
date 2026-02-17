"use server";

import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { clientClerk } from "@/src/lib/clerk/client";
import { getActiveSeason } from "@/src/services/season/getActiveSeason";
import z from "zod";

const onboardingSchema = z.object({
    userName: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
        ),
    displayName: z
        .string()
        .min(2, "IGN must be at least 2 characters")
        .max(50, "IGN must be at most 50 characters"),
    dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    referralCode: z.string().optional(),  // Optional referral code from promoter
});

export async function POST(req: Request) {
    try {
        const user = await tokenMiddleware(req);

        // Check if user is already onboarded
        if (user.isOnboarded) {
            return ErrorResponse({
                message: "User is already onboarded",
                status: 400,
            });
        }

        const body = await req.json();
        const { userName, displayName, dateOfBirth, referralCode } = onboardingSchema.parse(body);

        // Validate referral code if provided
        // Also block referral for users who already have a player (legacy users without isOnboarded)
        let promoterUser = null;
        if (referralCode && !user.playerId) {
            promoterUser = await prisma.user.findUnique({
                where: { referralCode },
                select: { id: true, clerkId: true },
            });
            // Block self-referral: if promoter's clerkId matches current user's clerkId, ignore
            if (promoterUser && promoterUser.clerkId === user.clerkId) {
                promoterUser = null; // Ignore self-referral
            }
        }

        // Check if username is already taken
        const existingUser = await prisma.user.findUnique({
            where: { userName },
        });

        if (existingUser && existingUser.id !== user.id) {
            return ErrorResponse({
                message: "Username is already taken. Please choose a different one.",
                status: 409,
            });
        }

        // Check if displayName (BGMI IGN) is already taken (case-insensitive)
        const existingDisplayName = await prisma.user.findFirst({
            where: {
                displayName: {
                    equals: displayName,
                    mode: "insensitive",
                },
                id: { not: user.id },
            },
            select: { id: true },
        });

        if (existingDisplayName) {
            return ErrorResponse({
                message: "This Game Name is already taken by another player.",
                status: 409,
            });
        }

        // Get or create active season
        let activeSeason = await getActiveSeason();
        if (!activeSeason) {
            activeSeason = await prisma.season.create({
                data: {
                    startDate: new Date(),
                    description: "DEFAULT",
                    name: "DEFAULT",
                    createdBy: "SYSTEM",
                },
            });
        }

        // Create Player, UC, PlayerStats and update user in a transaction
        const updatedUser = await prisma.$transaction(async (tx) => {
            // 1. Create Player
            const player = await tx.player.create({
                data: {
                    userId: user.id,
                    seasons: { connect: { id: activeSeason.id } },
                },
            });

            // 2. Create UC for the player
            await tx.uC.create({
                data: {
                    userId: user.id,
                    playerId: player.id,
                },
            });

            // 3. Create PlayerStats for the active season
            await tx.playerStats.create({
                data: {
                    playerId: player.id,
                    seasonId: activeSeason.id,
                },
            });

            // 4. Update user with playerId, userName, displayName, and mark as onboarded
            const updated = await tx.user.update({
                where: { id: user.id },
                data: {
                    playerId: player.id,
                    userName,
                    displayName,
                    ...(dateOfBirth && { dateOfBirth }),
                    isOnboarded: true,
                    usernameLastChangeAt: new Date(),
                },
                include: {
                    player: {
                        include: {
                            characterImage: true,
                            playerBanned: true,
                            uc: true,
                        },
                    },
                },
            });

            // 5. Create Referral record if valid promoter exists
            if (promoterUser) {
                await tx.referral.create({
                    data: {
                        promoterId: promoterUser.id,
                        referredPlayerId: player.id,
                        status: "PENDING",
                        tournamentsCompleted: 0,
                    },
                });
            }

            return updated;
        });

        // Also update username in Clerk
        try {
            await clientClerk.users.updateUser(user.clerkId, {
                username: userName,
            });
        } catch (clerkError) {
            console.error("Failed to update Clerk username:", clerkError);
            // Don't fail the request if Clerk update fails
        }

        return SuccessResponse({
            data: updatedUser,
            message: "Username set successfully! Welcome to PUBGMI Tournament.",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

