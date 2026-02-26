import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/teams/[teamId]
 * Update team players — add or remove players from a team.
 * Body: { addPlayerIds?: string[], removePlayerIds?: string[] }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { teamId } = await params;
        const body = await req.json();
        const { addPlayerIds = [], removePlayerIds = [] } = body as {
            addPlayerIds?: string[];
            removePlayerIds?: string[];
        };

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { players: { select: { id: true } } },
        });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        const ops: Promise<unknown>[] = [];

        // Add players
        if (addPlayerIds.length > 0) {
            ops.push(
                prisma.team.update({
                    where: { id: teamId },
                    data: {
                        players: {
                            connect: addPlayerIds.map(id => ({ id })),
                        },
                    },
                })
            );
        }

        // Remove players
        if (removePlayerIds.length > 0) {
            ops.push(
                prisma.team.update({
                    where: { id: teamId },
                    data: {
                        players: {
                            disconnect: removePlayerIds.map(id => ({ id })),
                        },
                    },
                })
            );
        }

        await Promise.all(ops);

        // Fetch updated team
        const updated = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                players: {
                    select: {
                        id: true,
                        displayName: true,
                        user: { select: { username: true } },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: `Team updated: +${addPlayerIds.length} added, -${removePlayerIds.length} removed`,
            data: {
                id: updated?.id,
                playerCount: updated?.players.length ?? 0,
                players: updated?.players.map(p => ({
                    id: p.id,
                    name: p.displayName || p.user.username,
                })),
            },
        });
    } catch (error) {
        console.error("Error updating team:", error);
        return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
    }
}

/**
 * DELETE /api/teams/[teamId]
 * Delete a team and all associated records.
 * Body: { refund?: boolean }
 * If refund is true, the tournament entry fee is credited back to each player's wallet.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return ErrorResponse({ message: "Unauthorized", status: 403 });
        }

        const { teamId } = await params;

        let refund = false;
        try {
            const body = await req.json();
            refund = !!body.refund;
        } catch {
            // No body or invalid JSON — default to no refund
        }

        // Fetch the team with players and tournament info
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                players: {
                    select: { id: true, user: { select: { username: true } } },
                },
                tournament: {
                    select: { id: true, name: true, fee: true },
                },
            },
        });

        if (!team) {
            return ErrorResponse({ message: "Team not found", status: 404 });
        }

        const entryFee = team.tournament?.fee ?? 0;
        const playerIds = team.players.map((p) => p.id);
        const refundedPlayers: string[] = [];

        // Run all delete operations in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Refund UC to players if requested
            if (refund && entryFee > 0 && playerIds.length > 0) {
                // Create credit transactions
                await tx.transaction.createMany({
                    data: playerIds.map((playerId) => ({
                        amount: entryFee,
                        type: "CREDIT" as const,
                        description: `Refund: Team deleted from ${team.tournament?.name ?? "tournament"}`,
                        playerId,
                    })),
                });

                // Update wallet balances
                for (const playerId of playerIds) {
                    await tx.wallet.upsert({
                        where: { playerId },
                        create: { playerId, balance: entryFee },
                        update: { balance: { increment: entryFee } },
                    });
                }

                refundedPlayers.push(...playerIds);
            }

            // 2. Delete related records
            await tx.teamPlayerStats.deleteMany({ where: { teamId } });
            await tx.teamStats.deleteMany({ where: { teamId } });
            await tx.matchPlayerPlayed.deleteMany({ where: { teamId } });
            await tx.tournamentWinner.deleteMany({ where: { teamId } });

            // 3. Disconnect team from matches and players, then delete
            await tx.team.update({
                where: { id: teamId },
                data: {
                    matches: { set: [] },
                    players: { set: [] },
                },
            });

            await tx.team.delete({ where: { id: teamId } });
        });

        const refundMsg =
            refund && entryFee > 0 && refundedPlayers.length > 0
                ? ` ${entryFee} UC refunded to ${refundedPlayers.length} player(s).`
                : "";

        return SuccessResponse({
            message: `Team "${team.name}" deleted.${refundMsg}`,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to delete team", error });
    }
}
