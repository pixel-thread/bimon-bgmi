import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

const DISLIKE_BAN_THRESHOLD = 5;

/**
 * POST /api/job-listings/[id]/react
 * Like or dislike a job listing. Toggle off if same reaction.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        const { id } = await params;
        const body = await req.json();
        const { reactionType } = body;

        if (!["like", "dislike"].includes(reactionType)) {
            return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
        }

        const listing = await prisma.playerJobListing.findUnique({ where: { id } });
        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        // Can't react to your own listing
        if (listing.playerId === user.player.id) {
            return NextResponse.json({ error: "Can't react to own listing" }, { status: 400 });
        }

        const existing = await prisma.jobListingReaction.findUnique({
            where: { listingId_playerId: { listingId: id, playerId: user.player.id } },
        });

        let newLike = listing.likeCount;
        let newDislike = listing.dislikeCount;
        let userReaction: string | null = reactionType;

        if (existing) {
            if (existing.reactionType === reactionType) {
                // Toggle off
                await prisma.jobListingReaction.delete({ where: { id: existing.id } });
                if (reactionType === "like") newLike--;
                else newDislike--;
                userReaction = null;
            } else {
                // Switch reaction
                await prisma.jobListingReaction.update({
                    where: { id: existing.id },
                    data: { reactionType },
                });
                if (reactionType === "like") {
                    newLike++;
                    newDislike--;
                } else {
                    newDislike++;
                    newLike--;
                }
            }
        } else {
            // New reaction
            await prisma.jobListingReaction.create({
                data: { listingId: id, playerId: user.player.id, reactionType },
            });
            if (reactionType === "like") newLike++;
            else newDislike++;
        }

        newLike = Math.max(0, newLike);
        newDislike = Math.max(0, newDislike);

        // Auto-ban if too many dislikes
        const isJobBanned = newDislike >= DISLIKE_BAN_THRESHOLD;

        await prisma.playerJobListing.update({
            where: { id },
            data: { likeCount: newLike, dislikeCount: newDislike, isJobBanned },
        });

        return NextResponse.json({
            success: true,
            data: { likeCount: newLike, dislikeCount: newDislike, isJobBanned, userReaction },
        });
    } catch (error) {
        console.error("Error reacting to listing:", error);
        return NextResponse.json({ error: "Failed to react" }, { status: 500 });
    }
}
