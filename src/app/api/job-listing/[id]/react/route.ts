"use server";

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";

const reactSchema = z.object({
    reactionType: z.enum(["like", "dislike"]),
});

// POST - Like or dislike a job listing
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await tokenMiddleware(req);
        const { id: listingId } = await params;

        if (!user) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        // Get player from user
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        // Get the listing
        const listing = await prisma.playerJobListing.findUnique({
            where: { id: listingId },
        });

        if (!listing) {
            return ErrorResponse({ message: "Listing not found", status: 404 });
        }

        // Can't react to your own listing
        if (listing.playerId === player.id) {
            return ErrorResponse({ message: "Cannot react to your own listing", status: 400 });
        }

        const body = reactSchema.parse(await req.json());

        // Check if user already reacted
        const existingReaction = await prisma.jobListingReaction.findUnique({
            where: {
                listingId_playerId: {
                    listingId,
                    playerId: player.id,
                },
            },
        });

        if (existingReaction) {
            // Already reacted - update or remove
            if (existingReaction.reactionType === body.reactionType) {
                // Same reaction - remove it
                await prisma.jobListingReaction.delete({
                    where: { id: existingReaction.id },
                });

                // Update counts
                const updateData = body.reactionType === "like"
                    ? { likeCount: { decrement: 1 } }
                    : { dislikeCount: { decrement: 1 } };

                const updatedListing = await prisma.playerJobListing.update({
                    where: { id: listingId },
                    data: updateData,
                });

                return SuccessResponse({
                    data: {
                        likeCount: updatedListing.likeCount,
                        dislikeCount: updatedListing.dislikeCount,
                        isJobBanned: updatedListing.isJobBanned,
                        userReaction: null,
                    },
                    message: "Reaction removed",
                });
            } else {
                // Different reaction - update it
                await prisma.jobListingReaction.update({
                    where: { id: existingReaction.id },
                    data: { reactionType: body.reactionType },
                });

                // Update counts (increment new, decrement old)
                const updateData = body.reactionType === "like"
                    ? { likeCount: { increment: 1 }, dislikeCount: { decrement: 1 } }
                    : { likeCount: { decrement: 1 }, dislikeCount: { increment: 1 } };

                let updatedListing = await prisma.playerJobListing.update({
                    where: { id: listingId },
                    data: updateData,
                });

                // Check if should ban (5+ dislikes)
                if (updatedListing.dislikeCount >= 5 && !updatedListing.isJobBanned) {
                    updatedListing = await prisma.playerJobListing.update({
                        where: { id: listingId },
                        data: { isJobBanned: true, isActive: false },
                    });

                    // Create notification for the listing owner
                    await prisma.notification.create({
                        data: {
                            playerId: listing.playerId,
                            type: "JOB_BANNED",
                            title: "Job Listing Banned",
                            message: "Your job listing has been banned due to receiving too many dislikes. Contact an admin if you believe this is a mistake.",
                        },
                    });
                }

                return SuccessResponse({
                    data: {
                        likeCount: updatedListing.likeCount,
                        dislikeCount: updatedListing.dislikeCount,
                        isJobBanned: updatedListing.isJobBanned,
                        userReaction: body.reactionType,
                    },
                    message: "Reaction updated",
                });
            }
        } else {
            // New reaction
            await prisma.jobListingReaction.create({
                data: {
                    listingId,
                    playerId: player.id,
                    reactionType: body.reactionType,
                },
            });

            // Update counts
            const updateData = body.reactionType === "like"
                ? { likeCount: { increment: 1 } }
                : { dislikeCount: { increment: 1 } };

            let updatedListing = await prisma.playerJobListing.update({
                where: { id: listingId },
                data: updateData,
            });

            // Check if should ban (5+ dislikes)
            if (updatedListing.dislikeCount >= 5 && !updatedListing.isJobBanned) {
                updatedListing = await prisma.playerJobListing.update({
                    where: { id: listingId },
                    data: { isJobBanned: true, isActive: false },
                });

                // Create notification for the listing owner
                await prisma.notification.create({
                    data: {
                        playerId: listing.playerId,
                        type: "JOB_BANNED",
                        title: "Job Listing Banned",
                        message: "Your job listing has been banned due to receiving too many dislikes. Contact an admin if you believe this is a mistake.",
                    },
                });
            }

            return SuccessResponse({
                data: {
                    likeCount: updatedListing.likeCount,
                    dislikeCount: updatedListing.dislikeCount,
                    isJobBanned: updatedListing.isJobBanned,
                    userReaction: body.reactionType,
                },
                message: body.reactionType === "like" ? "Liked!" : "Disliked",
            });
        }
    } catch (error) {
        return handleApiErrors(error);
    }
}
