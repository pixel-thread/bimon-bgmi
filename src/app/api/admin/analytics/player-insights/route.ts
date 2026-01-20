import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { superAdminMiddleware } from "@/src/utils/middleware/superAdminMiddleware";
import { getDisplayName } from "@/src/utils/displayName";

interface PlayerFinancials {
    playerId: string;
    userName: string;
    entryFees: number;
    prizes: number;
    tournaments: number;
}

interface PlayerInsightData {
    rank: number;
    player: string;
    playerId?: string;
    tournaments: number;
    entryFees: number;
    prizes: number;
    amount: number; // profit or loss
    supportReceived?: { from: string; amount: number; tournament: string }[];
    totalSupport?: number;
}

export async function GET(req: Request) {
    try {
        await superAdminMiddleware(req);

        const { searchParams } = new URL(req.url);
        const seasonId = searchParams.get("seasonId");

        // Get all seasons for the dropdown
        const seasons = await prisma.season.findMany({
            orderBy: { startDate: "desc" },
            select: { id: true, name: true, status: true },
        });

        // If no seasonId provided, use the active season or first season
        // "lifetime" means all seasons combined
        const isLifetime = seasonId === "lifetime";
        const targetSeasonId = isLifetime ? "lifetime" : (seasonId ||
            seasons.find(s => s.status === "ACTIVE")?.id ||
            seasons[0]?.id);

        if (!targetSeasonId) {
            return NextResponse.json({
                seasons: [],
                losers: [],
                winners: [],
                summary: {
                    playersInLoss: 0,
                    playersInProfit: 0,
                    totalLosses: 0,
                    totalProfits: 0,
                },
                keyInsight: null,
            });
        }

        // Get tournaments - all if lifetime, otherwise for specific season
        const tournaments = await prisma.tournament.findMany({
            where: isLifetime ? {} : { seasonId: targetSeasonId },
            select: { id: true, name: true },
        });

        const tournamentIds = tournaments.map((t) => t.id);

        if (tournamentIds.length === 0) {
            return NextResponse.json({
                seasons,
                selectedSeasonId: targetSeasonId,
                losers: [],
                winners: [],
                summary: {
                    playersInLoss: 0,
                    playersInProfit: 0,
                    totalLosses: 0,
                    totalProfits: 0,
                },
                keyInsight: null,
            });
        }

        // Get all players who have participated in these tournaments
        const teams = await prisma.team.findMany({
            where: { tournamentId: { in: tournamentIds } },
            include: {
                players: {
                    include: {
                        user: { select: { userName: true, displayName: true } },
                        transactions: true,
                    },
                },
            },
        });

        // Calculate financials for each player
        const playerMap = new Map<string, PlayerFinancials>();
        const playerTournaments = new Map<string, Set<string>>();

        for (const team of teams) {
            for (const player of team.players) {
                // Track which tournaments this player participated in
                if (!playerTournaments.has(player.id)) {
                    playerTournaments.set(player.id, new Set());
                }
                if (team.tournamentId) {
                    playerTournaments.get(player.id)!.add(team.tournamentId);
                }

                if (playerMap.has(player.id)) continue;

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

                playerMap.set(player.id, {
                    playerId: player.id,
                    userName: getDisplayName(player.user.displayName, player.user.userName),
                    entryFees,
                    prizes,
                    tournaments: playerTournaments.get(player.id)?.size || 0,
                });
            }
        }

        // Update tournament counts
        for (const [playerId, data] of playerMap) {
            data.tournaments = playerTournaments.get(playerId)?.size || 0;
        }

        // Separate losers and winners
        const losers: PlayerInsightData[] = [];
        const winners: PlayerInsightData[] = [];
        let totalLosses = 0;
        let totalProfits = 0;

        for (const [playerId, data] of playerMap) {
            const netResult = data.prizes - data.entryFees;

            if (netResult < 0) {
                totalLosses += Math.abs(netResult);
                losers.push({
                    rank: 0,
                    player: data.userName,
                    playerId: playerId,
                    tournaments: data.tournaments,
                    entryFees: data.entryFees,
                    prizes: data.prizes,
                    amount: Math.abs(netResult),
                });
            } else if (netResult > 0) {
                totalProfits += netResult;
                winners.push({
                    rank: 0,
                    player: data.userName,
                    tournaments: data.tournaments,
                    entryFees: data.entryFees,
                    prizes: data.prizes,
                    amount: netResult,
                });
            }
        }

        // Sort and assign ranks
        losers.sort((a, b) => b.amount - a.amount);
        winners.sort((a, b) => b.amount - a.amount);

        losers.forEach((l, i) => (l.rank = i + 1));
        winners.forEach((w, i) => (w.rank = i + 1));

        // Get support transactions for top 10 losers (solo tax redistributions)
        const top10LoserIds = losers.slice(0, 10).map(l => l.playerId).filter(Boolean) as string[];
        const supportTransactions = await prisma.transaction.findMany({
            where: {
                playerId: { in: top10LoserIds },
                description: { startsWith: "Support from" },
            },
            orderBy: { timestamp: "desc" },
        });

        // Parse support transactions and attach to losers
        // Format: "Support from PlayerName: TournamentName"
        for (const loser of losers.slice(0, 10)) {
            if (!loser.playerId) continue;
            const supports = supportTransactions
                .filter(tx => tx.playerId === loser.playerId)
                .map(tx => {
                    const match = tx.description.match(/^Support from (.+): (.+)$/);
                    return {
                        from: match?.[1] || "Unknown",
                        amount: tx.amount,
                        tournament: match?.[2] || "Unknown",
                    };
                });
            loser.supportReceived = supports;
            loser.totalSupport = supports.reduce((sum, s) => sum + s.amount, 0);
        }

        // Generate key insight - find players who played all tournaments but won nothing
        const totalTournaments = tournaments.length;
        const unluckyPlayers = Array.from(playerMap.values())
            .filter(p => p.tournaments === totalTournaments && p.prizes === 0)
            .map(p => p.userName);

        let keyInsight = null;
        if (unluckyPlayers.length > 0) {
            const names = unluckyPlayers.slice(0, 3).join(", ");
            const lossAmount = Array.from(playerMap.values())
                .find(p => p.tournaments === totalTournaments && p.prizes === 0)?.entryFees || 0;
            keyInsight = `${names}${unluckyPlayers.length > 3 ? ` and ${unluckyPlayers.length - 3} more` : ""} played ALL ${totalTournaments} tournaments but never won anything - they each lost ₹${lossAmount}!`;
        }

        return NextResponse.json({
            seasons,
            selectedSeasonId: targetSeasonId,
            losers: losers.slice(0, 10), // Top 10 losers
            winners: winners.slice(0, 10), // Top 10 winners
            summary: {
                playersInLoss: losers.length,
                playersInProfit: winners.length,
                totalLosses,
                totalProfits,
            },
            keyInsight,
        });
    } catch (error) {
        console.error("Error fetching player insights:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to fetch player insights", details: errorMessage },
            { status: 500 }
        );
    }
}
