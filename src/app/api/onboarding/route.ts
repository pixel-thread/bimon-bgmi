import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail, getAuthName, getAuthImage } from "@/lib/auth";
import { type NextRequest } from "next/server";
import { getSettings } from "@/lib/settings";

/**
 * POST /api/onboarding
 * Creates or updates the user's player profile during onboarding.
 * Auto-creates the DB User record for new Clerk users.
 */
export async function POST(request: NextRequest) {
    try {
        const userId = await getAuthEmail();
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

        // Find or create the user
        let user = await prisma.user.findUnique({
            where: { email: userId },
            include: { player: true },
        });

        if (!user) {
            // New user — create DB record using NextAuth session data
            const name = await getAuthName();
            const image = await getAuthImage();

            const username =
                (name || "user")
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "") +
                Math.floor(Math.random() * 9000 + 1000);

            user = await prisma.user.create({
                data: {
                    clerkId: `google_${Date.now()}`, // placeholder for backward compat
                    username,
                    email: userId!,
                    imageUrl: image || null,
                },
                include: { player: true },
            });
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

                // Create referral record if referrals enabled and valid code provided
                const settings = await getSettings();
                if (settings.enableReferrals && referralCode) {
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
