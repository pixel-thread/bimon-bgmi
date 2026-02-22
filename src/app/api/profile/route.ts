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
                        stats: {
                            take: 1,
                            orderBy: { createdAt: "desc" },
                            select: {
                                kills: true,
                                matches: true,
                                kd: true,
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
        const latestStats = player?.stats[0];

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
                    bio: player.bio || `nga u ${player.displayName || user.username} dei u ${player.category}`,
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
                    stats: latestStats
                        ? {
                            kills: latestStats.kills,
                            matches: latestStats.matches,
                            kd: latestStats.kd,
                        }
                        : null,
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
