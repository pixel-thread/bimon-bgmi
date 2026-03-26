import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";
import { requireAdmin } from "@/lib/auth";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";

/**
 * POST /api/players/[id]/link
 * Admin-only: Merge a legacy Player's data into a target User's Player.
 *
 * Body: { targetEmail: string }
 *
 * Scenario: A Season 1 player signs up again in Season 4.3 with a new
 * account. They now have two Player records:
 *   - Old Player (this one, [id]): has history from Seasons 1-4.2
 *   - New Player (on targetEmail's User): has data from Season 4.3
 *
 * This endpoint MERGES the old player's records INTO the new player,
 * then deletes the old player. The new player keeps all their data
 * and also gets the old data.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return ErrorResponse({ message: "Admin access required", status: 403 });
        }

        const { id: oldPlayerId } = await params;
        const { targetEmail } = (await req.json()) as { targetEmail?: string };

        if (!targetEmail?.trim()) {
            return ErrorResponse({ message: "Target email is required", status: 400 });
        }

        // 1. Get the legacy (old) player
        const oldPlayer = await prisma.player.findUnique({
            where: { id: oldPlayerId },
            include: {
                user: { select: { id: true, email: true, username: true } },
                wallet: { select: { id: true, balance: true } },
            },
        });

        if (!oldPlayer) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // 2. Find the target user by email
        const targetUser = await prisma.user.findUnique({
            where: { email: targetEmail.trim().toLowerCase() },
            include: {
                player: {
                    select: {
                        id: true,
                        displayName: true,
                        wallet: { select: { id: true, balance: true } },
                    },
                },
            },
        });

        if (!targetUser) {
            return ErrorResponse({
                message: `No user found with email: ${targetEmail}`,
                status: 404,
            });
        }

        // 3. Don't merge with self
        if (targetUser.id === oldPlayer.user.id) {
            return ErrorResponse({
                message: "Player is already linked to this user",
                status: 400,
            });
        }

        const newPlayer = targetUser.player;

        if (!newPlayer) {
            return ErrorResponse({
                message: `User "${targetUser.email}" doesn't have a player profile yet. They need to sign up and onboard first.`,
                status: 400,
            });
        }

        const newPlayerId = newPlayer.id;

        // 4. Merge: move all old player's records to the new player
        await prisma.$transaction(async (tx) => {
            // ── Move all foreign-key references from oldPlayerId → newPlayerId ──

            // Team memberships
            // Skip teams where the new player is already a member (avoid unique constraint)
            const existingTeamIds = (await tx.team.findMany({
                where: { players: { some: { id: newPlayerId } } },
                select: { id: true },
            })).map(t => t.id);

            // For teams, we need to use the many-to-many disconnect/connect
            const oldTeams = await tx.team.findMany({
                where: { players: { some: { id: oldPlayerId } } },
                select: { id: true },
            });
            for (const team of oldTeams) {
                await tx.team.update({
                    where: { id: team.id },
                    data: {
                        players: {
                            disconnect: { id: oldPlayerId },
                            ...(existingTeamIds.includes(team.id) ? {} : { connect: { id: newPlayerId } }),
                        },
                    },
                });
            }

            // Matches (many-to-many)
            const oldMatches = await tx.match.findMany({
                where: { players: { some: { id: oldPlayerId } } },
                select: { id: true },
            });
            const existingMatchIds = (await tx.match.findMany({
                where: { players: { some: { id: newPlayerId } } },
                select: { id: true },
            })).map(m => m.id);
            for (const match of oldMatches) {
                await tx.match.update({
                    where: { id: match.id },
                    data: {
                        players: {
                            disconnect: { id: oldPlayerId },
                            ...(existingMatchIds.includes(match.id) ? {} : { connect: { id: newPlayerId } }),
                        },
                    },
                });
            }

            // Season memberships (many-to-many via PlayerSeason)
            const oldSeasons = await tx.season.findMany({
                where: { players: { some: { id: oldPlayerId } } },
                select: { id: true },
            });
            const existingSeasonIds = (await tx.season.findMany({
                where: { players: { some: { id: newPlayerId } } },
                select: { id: true },
            })).map(s => s.id);
            for (const season of oldSeasons) {
                await tx.season.update({
                    where: { id: season.id },
                    data: {
                        players: {
                            disconnect: { id: oldPlayerId },
                            ...(existingSeasonIds.includes(season.id) ? {} : { connect: { id: newPlayerId } }),
                        },
                    },
                });
            }

            // Simple foreign key updates (one-to-many, playerId column)
            await tx.playerStats.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.teamPlayerStats.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.matchPlayerPlayed.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.transaction.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.pendingReward.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.playerPollVote.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.gameScore.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.prizePoolDonation.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });

            // TeamStats (many-to-many via players)
            const oldTeamStats = await tx.teamStats.findMany({
                where: { players: { some: { id: oldPlayerId } } },
                select: { id: true },
            });
            const existingTeamStatIds = (await tx.teamStats.findMany({
                where: { players: { some: { id: newPlayerId } } },
                select: { id: true },
            })).map(ts => ts.id);
            for (const ts of oldTeamStats) {
                await tx.teamStats.update({
                    where: { id: ts.id },
                    data: {
                        players: {
                            disconnect: { id: oldPlayerId },
                            ...(existingTeamStatIds.includes(ts.id) ? {} : { connect: { id: newPlayerId } }),
                        },
                    },
                });
            }

            // Polls (many-to-many via players)
            const oldPolls = await tx.poll.findMany({
                where: { players: { some: { id: oldPlayerId } } },
                select: { id: true },
            });
            const existingPollIds = (await tx.poll.findMany({
                where: { players: { some: { id: newPlayerId } } },
                select: { id: true },
            })).map(p => p.id);
            for (const poll of oldPolls) {
                await tx.poll.update({
                    where: { id: poll.id },
                    data: {
                        players: {
                            disconnect: { id: oldPlayerId },
                            ...(existingPollIds.includes(poll.id) ? {} : { connect: { id: newPlayerId } }),
                        },
                    },
                });
            }

            // UC Transfers
            await tx.uCTransfer.updateMany({ where: { fromPlayerId: oldPlayerId }, data: { fromPlayerId: newPlayerId } });
            await tx.uCTransfer.updateMany({ where: { toPlayerId: oldPlayerId }, data: { toPlayerId: newPlayerId } });

            // Bracket matches
            await tx.bracketMatch.updateMany({ where: { player1Id: oldPlayerId }, data: { player1Id: newPlayerId } });
            await tx.bracketMatch.updateMany({ where: { player2Id: oldPlayerId }, data: { player2Id: newPlayerId } });
            await tx.bracketMatch.updateMany({ where: { winnerId: oldPlayerId }, data: { winnerId: newPlayerId } });
            await tx.bracketResult.updateMany({ where: { submittedById: oldPlayerId }, data: { submittedById: newPlayerId } });

            // Merit ratings
            await tx.playerMeritRating.updateMany({ where: { fromPlayerId: oldPlayerId }, data: { fromPlayerId: newPlayerId } });
            await tx.playerMeritRating.updateMany({ where: { toPlayerId: oldPlayerId }, data: { toPlayerId: newPlayerId } });

            // Community
            await tx.communityMessage.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });
            await tx.communityPollVote.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });

            // Royal passes
            await tx.royalPass.updateMany({ where: { playerId: oldPlayerId }, data: { playerId: newPlayerId } });

            // Merge wallet balance: add old balance to new
            const oldBalance = oldPlayer.wallet?.balance ?? 0;
            if (oldBalance !== 0 && newPlayer.wallet) {
                await tx.wallet.update({
                    where: { id: newPlayer.wallet.id },
                    data: { balance: { increment: oldBalance } },
                });
            }

            // Delete old player's unique dependents first
            await tx.wallet.deleteMany({ where: { playerId: oldPlayerId } });
            await tx.playerStreak.deleteMany({ where: { playerId: oldPlayerId } });
            await tx.playerBan.deleteMany({ where: { playerId: oldPlayerId } });
            await tx.pushSubscription.deleteMany({ where: { playerId: oldPlayerId } });
            await tx.playerJobListing.deleteMany({ where: { playerId: oldPlayerId } });
            await tx.referral.deleteMany({ where: { referredPlayerId: oldPlayerId } });
            await tx.notification.deleteMany({ where: { playerId: oldPlayerId } });
            await tx.jobListingReaction.deleteMany({ where: { playerId: oldPlayerId } });

            // Finally delete the old player
            await tx.player.delete({ where: { id: oldPlayerId } });
        });

        return SuccessResponse({
            message: `Merged "${oldPlayer.displayName}" into "${newPlayer.displayName}" (${targetUser.email}). All history has been combined.`,
            data: {
                oldPlayerId,
                newPlayerId,
                targetEmail: targetUser.email,
            },
        });
    } catch (error) {
        console.error("Failed to merge player:", error);
        return ErrorResponse({ message: "Failed to merge player", error });
    }
}
