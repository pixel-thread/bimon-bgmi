import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";

/**
 * POST /api/onboarding
 * Creates or updates the user's player profile during onboarding.
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { displayName, referralCode } = body as {
            displayName: string;
            referralCode?: string;
        };

        if (!displayName?.trim() || displayName.trim().length < 3) {
            return ErrorResponse({
                message: "Display name must be at least 3 characters",
                status: 400,
            });
        }

        // Find the user
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { player: true },
        });

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        if (user.isOnboarded && user.player) {
            return SuccessResponse({
                data: { playerId: user.player.id },
                message: "Already onboarded",
            });
        }

        // Create player + wallet + streak in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create player if doesn't exist
            let player = user.player;

            if (!player) {
                player = await tx.player.create({
                    data: {
                        userId: user.id,
                        displayName: displayName.trim(),
                    },
                });

                // Create wallet
                await tx.wallet.create({
                    data: {
                        playerId: player.id,
                    },
                });

                // Create streak tracker
                await tx.playerStreak.create({
                    data: {
                        playerId: player.id,
                    },
                });

                // Create referral record if a valid referral code was provided
                if (referralCode) {
                    const promoter = await tx.user.findFirst({
                        where: { username: referralCode },
                    });
                    // Only create if promoter exists and isn't self-referring
                    if (promoter && promoter.id !== user.id) {
                        await tx.referral.create({
                            data: {
                                promoterId: promoter.id,
                                referredPlayerId: player.id,
                            },
                        });
                    }
                }
            } else {
                // Update display name
                player = await tx.player.update({
                    where: { id: player.id },
                    data: { displayName: displayName.trim() },
                });
            }

            // Mark user as onboarded
            await tx.user.update({
                where: { id: user.id },
                data: { isOnboarded: true },
            });

            return player;
        });

        return SuccessResponse({
            data: { playerId: result.id },
            message: "Onboarding complete",
        });
    } catch (error) {
        return ErrorResponse({ message: "Onboarding failed", error });
    }
}
