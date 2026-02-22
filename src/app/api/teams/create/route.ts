import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { type NextRequest } from "next/server";

/**
 * POST /api/teams/create
 * Creates a new team for a tournament + match with selected players.
 * Optionally deducts UC entry fees.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return ErrorResponse({ message: "Unauthorized", status: 403 });
        }

        const body = await request.json();
        const {
            tournamentId,
            matchId,
            playerIds,
            deductUC = false,
        } = body as {
            tournamentId: string;
            matchId: string;
            playerIds: string[];
            deductUC?: boolean;
        };

        if (!tournamentId || !matchId || !playerIds?.length) {
            return ErrorResponse({ message: "tournamentId, matchId, and playerIds are required", status: 400 });
        }

        // 1. Validate tournament, match, and players in parallel
        const [tournament, match, players] = await Promise.all([
            prisma.tournament.findUnique({
                where: { id: tournamentId },
                select: { id: true, name: true, fee: true, seasonId: true },
            }),
            prisma.match.findUnique({
                where: { id: matchId },
                select: { id: true },
            }),
            prisma.player.findMany({
                where: { id: { in: playerIds } },
                select: {
                    id: true,
                    user: { select: { username: true } },
                    wallet: { select: { balance: true } },
                },
            }),
        ]);

        if (!tournament) return ErrorResponse({ message: "Tournament not found", status: 404 });
        if (!match) return ErrorResponse({ message: "Match not found", status: 404 });
        if (players.length !== playerIds.length) {
            return ErrorResponse({ message: "One or more players not found", status: 404 });
        }

        // 2. Check for duplicate team assignments
        const existing = await prisma.team.findMany({
            where: { tournamentId, players: { some: { id: { in: playerIds } } } },
            select: { players: { select: { id: true }, where: { id: { in: playerIds } } } },
        });
        const alreadyAssigned = existing.flatMap((t) => t.players.map((p) => p.id));
        if (alreadyAssigned.length > 0) {
            return ErrorResponse({
                message: `Players already on a team: ${alreadyAssigned.join(", ")}`,
                status: 400,
            });
        }

        // 3. Create team
        const teamCount = await prisma.team.count({ where: { tournamentId } });

        // Preserve input order for team name
        const playerMap = new Map(players.map((p) => [p.id, p]));
        const orderedPlayers = playerIds.map((id) => playerMap.get(id)!);
        const teamName = orderedPlayers.map((p) => p.user.username).join("_");

        const team = await prisma.team.create({
            data: {
                name: teamName,
                teamNumber: teamCount + 1,
                tournament: { connect: { id: tournamentId } },
                matches: { connect: { id: matchId } },
                players: { connect: playerIds.map((id) => ({ id })) },
                ...(tournament.seasonId ? { season: { connect: { id: tournament.seasonId } } } : {}),
            },
        });

        // 4. Create TeamStats + TeamPlayerStats for this match
        const teamStats = await prisma.teamStats.create({
            data: {
                teamId: team.id,
                matchId,
                position: 0,
                ...(tournament.seasonId ? { seasonId: tournament.seasonId } : {}),
                tournamentId,
            },
        });

        await prisma.teamPlayerStats.createMany({
            data: playerIds.map((playerId) => ({
                playerId,
                teamId: team.id,
                matchId,
                teamStatsId: teamStats.id,
                kills: 0,
                present: true,
                ...(tournament.seasonId ? { seasonId: tournament.seasonId } : {}),
            })),
        });

        // 5. Create MatchPlayerPlayed records
        await prisma.matchPlayerPlayed.createMany({
            data: playerIds.map((playerId) => ({
                matchId,
                playerId,
                tournamentId,
                teamId: team.id,
                ...(tournament.seasonId ? { seasonId: tournament.seasonId } : {}),
            })),
        });

        // 6. UC deduction (optional)
        const entryFee = tournament.fee || 0;
        if (deductUC && entryFee > 0) {
            const balanceMap = new Map(
                orderedPlayers.map((p) => [p.id, p.wallet?.balance ?? 0])
            );

            // Create debit transactions
            await prisma.transaction.createMany({
                data: playerIds.map((playerId) => ({
                    amount: entryFee,
                    type: "DEBIT" as const,
                    description: `Entry fee for ${tournament.name}`,
                    playerId,
                })),
            });

            // Update wallet balances
            for (const playerId of playerIds) {
                const current = balanceMap.get(playerId) ?? 0;
                await prisma.wallet.upsert({
                    where: { playerId },
                    create: { playerId, balance: current - entryFee },
                    update: { balance: current - entryFee },
                });
            }
        }

        return SuccessResponse({
            data: { id: team.id, name: team.name, teamNumber: team.teamNumber },
            message: deductUC && entryFee > 0
                ? `Team created. ${entryFee} UC debited from each player.`
                : "Team created successfully",
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to create team", error });
    }
}
