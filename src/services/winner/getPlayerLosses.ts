import { prisma } from "@/src/lib/db/prisma";

interface PlayerLoss {
    playerId: string;
    userName: string;
    entryFees: number;
    prizes: number;
    loss: number;
}

export interface LoserTierData {
    lossAmount: number;
    playerIds: string[];
}

/**
 * Get player losses for the current season.
 * Loss = Entry Fees Paid - Prizes Won
 * Only counts players with positive loss (paid more than they won).
 * 
 * @param seasonId - Current season ID
 * @returns Array of top 3 loss tiers, grouped by loss amount (highest first)
 */
export async function getPlayerLosses(
    seasonId: string
): Promise<LoserTierData[]> {
    if (!seasonId) {
        return [];
    }

    // Get all tournaments in this season
    const tournaments = await prisma.tournament.findMany({
        where: { seasonId },
        select: { id: true, name: true },
    });

    const tournamentIds = tournaments.map((t) => t.id);

    if (tournamentIds.length === 0) {
        return [];
    }

    // Get all players who have participated in these tournaments
    const teams = await prisma.team.findMany({
        where: { tournamentId: { in: tournamentIds } },
        include: {
            players: {
                include: {
                    user: { select: { userName: true } },
                    transactions: true,
                },
            },
        },
    });

    // Track unique players
    const playerMap = new Map<string, PlayerLoss>();

    for (const team of teams) {
        for (const player of team.players) {
            if (playerMap.has(player.id)) continue;

            // Calculate entry fees and prizes from transactions
            let entryFees = 0;
            let prizes = 0;

            for (const tx of player.transactions) {
                // Check if transaction is related to this season's tournaments
                const isSeasonTransaction = tournaments.some(
                    (t) => tx.description.includes(t.name)
                );

                if (!isSeasonTransaction) continue;

                if (tx.type === "debit" && tx.description.toLowerCase().includes("entry")) {
                    entryFees += tx.amount;
                } else if (tx.type === "credit" && tx.description.toLowerCase().includes("prize")) {
                    prizes += tx.amount;
                }
            }

            const loss = entryFees - prizes;

            // Only include players with positive loss
            if (loss > 0) {
                playerMap.set(player.id, {
                    playerId: player.id,
                    userName: player.user.userName,
                    entryFees,
                    prizes,
                    loss,
                });
            }
        }
    }

    // Group by loss amount
    const lossGroups = new Map<number, string[]>();
    for (const [playerId, data] of playerMap) {
        const existing = lossGroups.get(data.loss) || [];
        existing.push(playerId);
        lossGroups.set(data.loss, existing);
    }

    // Sort by loss amount (highest first) and take top 3 groups
    const sortedLosses = Array.from(lossGroups.entries())
        .sort((a, b) => b[0] - a[0])
        .slice(0, 3)
        .map(([lossAmount, playerIds]) => ({
            lossAmount,
            playerIds,
        }));

    return sortedLosses;
}

/**
 * Get the solo tax pool for a season
 */
export async function getSoloTaxPool(seasonId: string): Promise<number> {
    const pool = await prisma.soloTaxPool.findFirst({
        where: { seasonId },
    });
    return pool?.amount || 0;
}

/**
 * Add to the solo tax pool for next tournament
 */
export async function addToSoloTaxPool(
    seasonId: string,
    amount: number
): Promise<void> {
    const existingPool = await prisma.soloTaxPool.findFirst({
        where: { seasonId },
    });

    if (existingPool) {
        await prisma.soloTaxPool.update({
            where: { id: existingPool.id },
            data: { amount: { increment: amount } },
        });
    } else {
        await prisma.soloTaxPool.create({
            data: {
                seasonId,
                amount,
            },
        });
    }
}

/**
 * Consume the solo tax pool (add to tournament prize pool)
 * Returns the amount consumed and resets the pool
 */
export async function consumeSoloTaxPool(seasonId: string): Promise<number> {
    const pool = await prisma.soloTaxPool.findFirst({
        where: { seasonId },
    });

    if (!pool || pool.amount === 0) {
        return 0;
    }

    const amount = pool.amount;

    // Reset the pool
    await prisma.soloTaxPool.update({
        where: { id: pool.id },
        data: { amount: 0 },
    });

    return amount;
}

/**
 * Check if a player voted SOLO in a tournament's poll
 */
export async function isPlayerSolo(
    playerId: string,
    tournamentId: string
): Promise<boolean> {
    const poll = await prisma.poll.findUnique({
        where: { tournamentId },
        include: {
            playersVotes: {
                where: { playerId },
            },
        },
    });

    if (!poll || poll.playersVotes.length === 0) {
        return false;
    }

    return poll.playersVotes[0].vote === "SOLO";
}
