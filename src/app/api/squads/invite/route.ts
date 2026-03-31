import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getCurrentUser, getAuthEmail } from "@/lib/auth";
import { GAME } from "@/lib/game-config";
import { getAvailableBalance, getEmailByPlayerId } from "@/lib/wallet-service";
import { type NextRequest } from "next/server";

/**
 * POST /api/squads/invite
 * Send an invite to a player to join your squad.
 * Body: { squadId, playerId }
 */
export async function POST(request: NextRequest) {
    try {
        if (!GAME.features.hasSquads) {
            return ErrorResponse({ message: "Squads are not available for this game", status: 400 });
        }

        const user = await getCurrentUser();
        if (!user?.player) {
            return ErrorResponse({ message: "Player profile required", status: 403 });
        }

        const body = await request.json();
        const { squadId, playerId: targetPlayerId } = body as { squadId: string; playerId: string };

        if (!squadId || !targetPlayerId) {
            return ErrorResponse({ message: "squadId and playerId are required", status: 400 });
        }

        const currentPlayerId = user.player.id;

        // Fetch squad
        const squad = await prisma.squad.findUnique({
            where: { id: squadId },
            include: {
                poll: {
                    select: {
                        id: true,
                        isActive: true,
                        tournament: { select: { name: true, fee: true } },
                    },
                },
                invites: { select: { playerId: true, status: true } },
            },
        });

        if (!squad) {
            return ErrorResponse({ message: "Squad not found", status: 404 });
        }

        // Must be captain
        if (squad.captainId !== currentPlayerId) {
            return ErrorResponse({ message: "Only the squad captain can invite players", status: 403 });
        }

        // Poll must be active
        if (!squad.poll.isActive) {
            return ErrorResponse({ message: "This poll is no longer active", status: 400 });
        }

        // Squad not full
        const acceptedCount = squad.invites.filter((i) => i.status === "ACCEPTED").length;
        if (acceptedCount >= GAME.squadSize) {
            return ErrorResponse({ message: "Squad is already full", status: 400 });
        }

        // Not already invited
        const existingInvite = squad.invites.find((i) => i.playerId === targetPlayerId);
        if (existingInvite && existingInvite.status !== "DECLINED") {
            return ErrorResponse({ message: "This player already has a pending or accepted invite", status: 400 });
        }

        // Target not in another squad for this poll
        const inOtherSquad = await prisma.squadInvite.findFirst({
            where: {
                playerId: targetPlayerId,
                status: { in: ["PENDING", "ACCEPTED"] },
                squad: {
                    pollId: squad.pollId,
                    status: { in: ["FORMING", "FULL"] },
                    id: { not: squadId },
                },
            },
        });

        if (inOtherSquad) {
            return ErrorResponse({ message: "This player is already in another squad for this tournament", status: 400 });
        }

        // Target player must have enough available balance
        const targetEmail = await getEmailByPlayerId(targetPlayerId);
        if (!targetEmail) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const { available } = await getAvailableBalance(targetEmail);
        if (available < squad.entryFee) {
            return ErrorResponse({
                message: `This player doesn't have enough ${GAME.currency} (needs ${squad.entryFee}, has ${available} available)`,
                status: 400,
            });
        }

        // Target not banned
        const targetPlayer = await prisma.player.findUnique({
            where: { id: targetPlayerId },
            select: {
                id: true,
                isBanned: true,
                displayName: true,
                user: { select: { id: true, username: true } },
            },
        });

        if (!targetPlayer || targetPlayer.isBanned) {
            return ErrorResponse({ message: "Cannot invite this player", status: 400 });
        }

        // Create invite + notification in a transaction
        const captainName = user.player.displayName;
        const tournamentName = squad.poll.tournament?.name ?? "tournament";

        await prisma.$transaction(async (tx) => {
            // Upsert invite (might be re-inviting after a decline)
            if (existingInvite) {
                await tx.squadInvite.updateMany({
                    where: { squadId, playerId: targetPlayerId },
                    data: { status: "PENDING", respondedAt: null },
                });
            } else {
                await tx.squadInvite.create({
                    data: {
                        squadId,
                        playerId: targetPlayerId,
                    },
                });
            }

            // Notify the target player
            await tx.notification.create({
                data: {
                    title: "🛡 Squad Invite",
                    message: `${captainName} invited you to "${squad.name}" for ${tournamentName}. Entry: ${squad.entryFee} ${GAME.currency}`,
                    type: "squad_invite",
                    userId: targetPlayer.user.id,
                    playerId: targetPlayerId,
                    link: "/vote",
                },
            });
        });

        return SuccessResponse({
            message: `Invite sent to ${targetPlayer.displayName ?? targetPlayer.user.username}`,
        });
    } catch (error) {
        return ErrorResponse({ message: "Failed to send invite", error });
    }
}
