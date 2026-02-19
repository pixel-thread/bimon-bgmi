import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/profile
 * Fetches the current user's complete profile with player data, stats, wallet, and streak.
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
                        stats: {
                            take: 1,
                            orderBy: { createdAt: "desc" },
                            select: {
                                kills: true,
                                deaths: true,
                                matches: true,
                                kd: true,
                            },
                        },
                        wallet: {
                            select: {
                                balance: true,
                            },
                        },
                        streak: {
                            select: {
                                current: true,
                                longest: true,
                                lastTournamentId: true,
                            },
                        },
                        characterImage: {
                            select: {
                                url: true,
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
        const data = {
            id: user.id,
            clerkId: user.clerkId,
            username: user.username,
            email: user.email,
            imageUrl: user.imageUrl,
            role: user.role,
            player: player
                ? {
                    id: player.id,
                    displayName: player.displayName,
                    category: player.category,
                    hasRoyalPass: player.hasRoyalPass,
                    isBanned: player.isBanned,
                    characterImage: player.characterImage,
                    stats: player.stats[0]
                        ? {
                            kills: player.stats[0].kills,
                            deaths: player.stats[0].deaths,
                            matches: player.stats[0].matches,
                            kd: Number(player.stats[0].kd),
                        }
                        : null,
                    wallet: {
                        balance: player.wallet?.balance ?? 0,
                    },
                    streak: player.streak
                        ? {
                            current: player.streak.current,
                            longest: player.streak.longest,
                        }
                        : null,
                }
                : null,
        };

        return SuccessResponse({ data, cache: CACHE.SHORT });
    } catch (error) {
        return ErrorResponse({ message: "Failed to fetch profile", error });
    }
}
