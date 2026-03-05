import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { NextRequest } from "next/server";
import { getSettings } from "@/lib/settings";

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
        const bio = typeof body.bio === "string" ? body.bio.trim() : undefined;
        const forceChange = body.forceChange === true; // client confirms paying 1 UC

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

        // Check cooldown if display name is being changed
        const settings = await getSettings();
        const NAME_CHANGE_FEE = settings.nameChangeFee;
        let nameChangeFee = 0;
        if (displayName && displayName !== user.player.displayName) {
            const lastChange = user.player.displayNameLastChangeAt;
            if (lastChange) {
                const elapsed = Date.now() - new Date(lastChange).getTime();
                if (elapsed < NAME_CHANGE_COOLDOWN_MS) {
                    const remainingMs = NAME_CHANGE_COOLDOWN_MS - elapsed;
                    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

                    if (!forceChange) {
                        // Tell client about cooldown — they can choose to pay
                        return ErrorResponse({
                            message: `Name change on cooldown (${remainingDays}d left). Pay ${NAME_CHANGE_FEE} UC to change now.`,
                            status: 429,
                        });
                    }

                    // Player chose to pay — allow going into debt
                    nameChangeFee = NAME_CHANGE_FEE;
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

        if (Object.keys(updateData).length === 0) {
            return SuccessResponse({ message: "Nothing to update" });
        }

        // Atomic: update player + charge UC if breaking cooldown
        const player = user.player!;
        await prisma.$transaction(async (tx) => {
            await tx.player.update({
                where: { id: player.id },
                data: updateData,
            });

            if (nameChangeFee > 0) {
                await tx.wallet.upsert({
                    where: { playerId: player.id },
                    create: { playerId: player.id, balance: -nameChangeFee },
                    update: { balance: { decrement: nameChangeFee } },
                });
                await tx.transaction.create({
                    data: {
                        playerId: player.id,
                        amount: nameChangeFee,
                        type: "DEBIT",
                        description: "Name Change Fee",
                    },
                });
            }
        });

        return SuccessResponse({
            message: nameChangeFee > 0
                ? `Game Name updated (${nameChangeFee} UC charged)`
                : "Profile updated",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update profile", error });
    }
}
