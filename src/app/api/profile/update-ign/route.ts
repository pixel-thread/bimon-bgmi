import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getSettings } from "@/lib/settings";
import { GAME } from "@/lib/game-config";
import { debitCentralWallet } from "@/lib/wallet-service";

const NAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

/**
 * POST /api/profile/update-ign
 * Updates the current player's display name (IGN) and/or bio.
 * - Display name change: free once per week, 1 UC to break cooldown.
 * - Bio change: always free.
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getAuthEmail();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await req.json();
        const displayName = body.displayName?.trim();
        const uid = typeof body.uid === "string" ? body.uid.trim() : undefined;
        const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
        const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : undefined;
        const forceChange = body.forceChange === true;

        // Validate displayName if provided
        if (displayName) {
            const settings = await getSettings();
            if (displayName.length < 2) {
                return ErrorResponse({ message: "Game Name must be at least 2 characters", status: 400 });
            }
            if (displayName.length > settings.maxIGNLength) {
                return ErrorResponse({ message: `Game Name must be ${settings.maxIGNLength} characters or less`, status: 400 });
            }
        }

        // Validate bio if provided
        if (bio !== undefined && bio.length > 100) {
            return ErrorResponse({ message: "Bio must be 100 characters or less", status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: userId },
            select: {
                username: true,
                player: {
                    select: {
                        id: true,
                        displayName: true,
                        displayNameLastChangeAt: true,
                        wallet: { select: { id: true, balance: true } },
                    },
                },
            },
        });

        if (!user?.player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Check cooldown if display name is being changed (only for BR games)
        const settings = await getSettings();
        const NAME_CHANGE_FEE = settings.nameChangeFee;
        let nameChangeFee = 0;
        if (displayName && displayName !== user.player.displayName) {
            // PES: no cooldown or fee for name changes
            if (GAME.features.hasBR) {
                const lastChange = user.player.displayNameLastChangeAt;
                if (lastChange) {
                    const elapsed = Date.now() - new Date(lastChange).getTime();
                    if (elapsed < NAME_CHANGE_COOLDOWN_MS) {
                        const remainingMs = NAME_CHANGE_COOLDOWN_MS - elapsed;
                        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

                        if (!forceChange) {
                            return ErrorResponse({
                                message: `Name change on cooldown (${remainingDays}d left). Pay ${NAME_CHANGE_FEE} ${GAME.currency} to change now.`,
                                status: 429,
                            });
                        }

                        nameChangeFee = NAME_CHANGE_FEE;
                    }
                }
            }

            // Check for duplicate IGN
            const existing = await prisma.player.findFirst({
                where: {
                    displayName: { equals: displayName, mode: "insensitive" },
                    id: { not: user.player.id },
                },
                select: { id: true },
            });

            if (existing) {
                return ErrorResponse({ message: "This Game Name is already taken", status: 409 });
            }
        }

        const updateData: Record<string, unknown> = {};
        if (displayName && displayName !== user.player.displayName) {
            updateData.displayName = displayName;
            updateData.displayNameLastChangeAt = new Date();
        }
        // Block bio editing for specific users (admin-locked bios)
        const BIO_LOCKED_USERS = ["kohduhhh", "gonison"];
        if (bio !== undefined && BIO_LOCKED_USERS.includes(user.username)) {
            return ErrorResponse({ message: "Ki Ge lah edit rei", status: 403 });
        }

        if (bio !== undefined) updateData.bio = bio;
        if (uid !== undefined) updateData.uid = uid;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber || null;

        if (Object.keys(updateData).length === 0) {
            return SuccessResponse({ message: "Nothing to update" });
        }

        // Charge name change fee via central wallet if applicable
        const player = user.player!;
        if (nameChangeFee > 0) {
            const walletResult = await debitCentralWallet(userId, nameChangeFee, "Name Change Fee", "OTHER");
            await prisma.$transaction(async (tx) => {
                await tx.player.update({
                    where: { id: player.id },
                    data: updateData,
                });
                await tx.wallet.upsert({
                    where: { playerId: player.id },
                    create: { playerId: player.id, balance: walletResult.balance },
                    update: { balance: walletResult.balance },
                });
                await tx.transaction.create({
                    data: {
                        playerId: player.id,
                        amount: nameChangeFee,
                        type: "DEBIT",
                        description: "Name Change Fee",
                    },
                });
            });
        } else {
            await prisma.player.update({
                where: { id: player.id },
                data: updateData,
            });
        }

        return SuccessResponse({
            message: nameChangeFee > 0
                ? `Game Name updated (${nameChangeFee} ${GAME.currency} charged)`
                : "Profile updated",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update profile", error });
    }
}
