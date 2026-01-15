import { prisma } from "@/src/lib/db/prisma";

const REFERRAL_COMMISSION = 5; // UC per qualified referral
const TOURNAMENTS_REQUIRED = 5; // Tournaments needed to qualify

/**
 * Process referral commission for a player who completed a tournament.
 * Called after tournament winner is declared.
 * 
 * @param playerId - The player who just completed a tournament
 * @returns Object with commission status
 */
export async function processReferralCommission(playerId: string): Promise<{
    credited: boolean;
    promoterId?: string;
    tournamentsCompleted?: number;
}> {
    // Find player's referral record (if they were referred)
    const referral = await prisma.referral.findUnique({
        where: { referredPlayerId: playerId },
        include: {
            promoter: {
                select: { id: true, userName: true },
            },
            referredPlayer: {
                include: {
                    user: { select: { displayName: true, userName: true } },
                },
            },
        },
    });

    // No referral record = player wasn't referred
    if (!referral) {
        return { credited: false };
    }

    // Already paid = skip
    if (referral.status === "PAID") {
        return {
            credited: false,
            tournamentsCompleted: referral.tournamentsCompleted
        };
    }

    // Increment tournaments completed
    const newCount = referral.tournamentsCompleted + 1;

    // Check if player now qualifies (5 tournaments)
    if (newCount >= TOURNAMENTS_REQUIRED) {
        // Player qualifies! Credit promoter and mark as paid
        await prisma.$transaction(async (tx) => {
            // 1. Update referral status to PAID
            await tx.referral.update({
                where: { id: referral.id },
                data: {
                    tournamentsCompleted: newCount,
                    status: "PAID",
                    qualifiedAt: new Date(),
                    paidAt: new Date(),
                },
            });

            // 2. Credit promoter's UC balance
            await tx.uC.upsert({
                where: { userId: referral.promoterId },
                create: {
                    user: { connect: { id: referral.promoterId } },
                    // Need to find promoter's playerId for uC record
                    player: {
                        connect: {
                            userId: referral.promoterId,
                        },
                    },
                    balance: REFERRAL_COMMISSION,
                },
                update: {
                    balance: { increment: REFERRAL_COMMISSION },
                },
            });

            // 3. Update promoter's earnings tracker
            await tx.user.update({
                where: { id: referral.promoterId },
                data: {
                    promoterEarnings: { increment: REFERRAL_COMMISSION },
                },
            });

            // 4. Get promoter's playerId for transaction
            const promoterUser = await tx.user.findUnique({
                where: { id: referral.promoterId },
                select: { playerId: true },
            });

            // 5. Create transaction record for promoter
            if (promoterUser?.playerId) {
                const playerName = referral.referredPlayer.user.displayName ||
                    referral.referredPlayer.user.userName;
                await tx.transaction.create({
                    data: {
                        playerId: promoterUser.playerId,
                        amount: REFERRAL_COMMISSION,
                        type: "credit",
                        description: `Referral bonus: ${playerName} completed ${TOURNAMENTS_REQUIRED} tournaments`,
                    },
                });
            }
        });

        return {
            credited: true,
            promoterId: referral.promoterId,
            tournamentsCompleted: newCount,
        };
    } else {
        // Player hasn't reached 5 yet, just increment counter
        await prisma.referral.update({
            where: { id: referral.id },
            data: {
                tournamentsCompleted: newCount,
                status: newCount >= TOURNAMENTS_REQUIRED ? "QUALIFIED" : "PENDING",
            },
        });

        return {
            credited: false,
            promoterId: referral.promoterId,
            tournamentsCompleted: newCount,
        };
    }
}
