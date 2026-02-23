import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/profile
 * Fetches the current user's complete profile with player data,
 * detailed stats, wallet, streak, and computed performance metrics.
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: {
                player: {
                    include: {
                        wallet: { select: { balance: true } },
                        streak: { select: { current: true, longest: true } },
                        characterImage: {
                            select: {
                                publicUrl: true,
                                thumbnailUrl: true,
                                isAnimated: true,
                                isVideo: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const player = user.player;

        // Compute detailed stats
        let detailedStats = null;
        if (player) {
            // Compute stats from TeamPlayerStats (source of truth)
            const statsAgg = await prisma.teamPlayerStats.aggregate({
                where: { playerId: player.id },
                _count: { matchId: true },
                _sum: { kills: true },
            });
            const totalKills = statsAgg._sum.kills ?? 0;
            const totalMatches = statsAgg._count.matchId;
            const kd = totalMatches > 0 ? totalKills / totalMatches : 0;
            const seasonsPlayed = await prisma.playerStats.count({ where: { playerId: player.id } });

            // Get team placements for wins/top10 and UC placements
            const teamPlacements = await prisma.teamStats.findMany({
                where: {
                    players: { some: { id: player.id } },
                },
                select: { position: true, tournamentId: true },
            });

            const wins = teamPlacements.filter((t) => t.position === 1).length;
            const top10 = teamPlacements.filter((t) => t.position >= 1 && t.position <= 10).length;
            const totalTournaments = new Set(teamPlacements.map((t) => t.tournamentId).filter(Boolean)).size;
            const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
            const top10Rate = totalMatches > 0 ? Math.round((top10 / totalMatches) * 100) : 0;

            // UC placements (1st through 5th)
            const ucPlacements = {
                first: teamPlacements.filter((t) => t.position === 1).length,
                second: teamPlacements.filter((t) => t.position === 2).length,
                third: teamPlacements.filter((t) => t.position === 3).length,
                fourth: teamPlacements.filter((t) => t.position === 4).length,
                fifth: teamPlacements.filter((t) => t.position === 5).length,
            };

            // Best match kills from TeamPlayerStats
            const bestKillRecord = await prisma.teamPlayerStats.findFirst({
                where: { playerId: player.id },
                orderBy: { kills: "desc" },
                select: { kills: true },
            });
            const bestMatchKills = bestKillRecord?.kills ?? 0;

            // Last match kills for K/D trend
            const lastTwoMatches = await prisma.teamPlayerStats.findMany({
                where: { playerId: player.id },
                orderBy: { createdAt: "desc" },
                take: 2,
                select: { kills: true },
            });
            const lastMatchKills = lastTwoMatches[0]?.kills ?? 0;

            // K/D trend: compare current kd with what it would be without last match
            let kdTrend: "up" | "down" | "same" = "same";
            let kdChange = 0;
            if (totalMatches > 1 && lastTwoMatches.length >= 2) {
                const prevKd = (totalKills - lastMatchKills) / (totalMatches - 1);
                kdChange = Number((kd - prevKd).toFixed(2));
                kdTrend = kdChange > 0 ? "up" : kdChange < 0 ? "down" : "same";
            }

            // Avg kills per match
            const avgKillsPerMatch = totalMatches > 0 ? Number((totalKills / totalMatches).toFixed(1)) : 0;

            detailedStats = {
                kills: totalKills,
                matches: totalMatches,
                kd: Number(kd.toFixed(2)),
                kdTrend,
                kdChange,
                lastMatchKills,
                seasonsPlayed,
                totalTournaments,
                bestMatchKills,
                wins,
                top10,
                winRate,
                top10Rate,
                avgKillsPerMatch,
                ucPlacements,
            };
        }

        const data = {
            id: user.id,
            clerkId: user.clerkId,
            username: user.username,
            email: user.email,
            imageUrl: player?.customProfileImageUrl || user.imageUrl,
            role: user.role,
            player: player
                ? {
                    id: player.id,
                    displayName: player.displayName || user.username,
                    bio: player.bio || `Nga u ${player.displayName || user.username} dei u ${player.category.charAt(0) + player.category.slice(1).toLowerCase()}`,
                    category: player.category,
                    hasRoyalPass: player.hasRoyalPass,
                    isBanned: player.isBanned,
                    characterImage: player.characterImage
                        ? {
                            url: player.characterImage.publicUrl,
                            thumbnailUrl: player.characterImage.thumbnailUrl,
                            isAnimated: player.characterImage.isAnimated,
                            isVideo: player.characterImage.isVideo,
                        }
                        : null,
                    stats: detailedStats,
                    wallet: player.wallet
                        ? { balance: player.wallet.balance }
                        : { balance: 0 },
                    streak: player.streak
                        ? {
                            current: player.streak.current,
                            longest: player.streak.longest,
                        }
                        : { current: 0, longest: 0 },
                }
                : null,
        };

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch profile", error });
    }
}
