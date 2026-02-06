import { prisma } from "@/src/lib/db/prisma";

type Props = {
  id: string;
};

/**
 * Optimized user lookup by Clerk ID.
 * 
 * Fetches user with player data needed for auth context.
 * Uses selective includes to reduce data transfer.
 */
export async function getUserByClerkId({ id }: Props) {
  return prisma.user.findUnique({
    where: { clerkId: id },
    include: {
      player: {
        select: {
          id: true,
          isBanned: true,
          isUCExempt: true,
          isTrusted: true,
          customProfileImageUrl: true,
          characterImageId: true,
          tournamentStreak: true,
          // Only include what's actually used in auth context
          characterImage: {
            select: {
              id: true,
              publicUrl: true,
              isAnimated: true,
              isVideo: true,
              thumbnailUrl: true,
            },
          },
          playerBanned: {
            select: {
              id: true,
              banReason: true,
              bannedAt: true,
              banDuration: true,
            },
          },
          uc: {
            select: {
              id: true,
              balance: true,
            },
          },
          playerStats: {
            select: {
              kills: true,
              deaths: true,
              seasonId: true,
            },
          },
        },
      },
    },
  });
}
