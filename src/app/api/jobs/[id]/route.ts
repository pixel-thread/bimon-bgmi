import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

// GET - Get a single job listing by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const listing = await prisma.playerJobListing.findUnique({
            where: { id },
            include: {
                player: {
                    select: {
                        customProfileImageUrl: true,
                        user: {
                            select: {
                                displayName: true,
                                userName: true,
                                clerkId: true,
                            },
                        },
                        characterImage: {
                            select: {
                                publicUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!listing) {
            return ErrorResponse({ message: "Job listing not found", status: 404 });
        }

        // Fetch Clerk image if no custom/character image (customProfileImageUrl takes priority)
        let imageUrl: string | null = listing.player.customProfileImageUrl || listing.player.characterImage?.publicUrl || null;
        if (!imageUrl && listing.player.user.clerkId) {
            try {
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(listing.player.user.clerkId);
                imageUrl = clerkUser.imageUrl || null;
            } catch {
                // Ignore clerk errors
            }
        }

        const result = {
            ...listing,
            player: {
                ...listing.player,
                imageUrl,
            },
        };

        return SuccessResponse({
            data: result,
            message: "Job listing fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
