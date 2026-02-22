import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/job-listings/[id]
 * Fetch a single job listing by ID.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await getCurrentUser();
        const playerId = user?.player?.id;

        const listing = await prisma.playerJobListing.findUnique({
            where: { id },
            include: {
                player: {
                    select: {
                        id: true,
                        displayName: true,
                        user: { select: { username: true } },
                    },
                },
                reactions: playerId
                    ? { where: { playerId }, select: { reactionType: true } }
                    : false,
            },
        });

        if (!listing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const data = {
            ...listing,
            userReaction:
                listing.reactions && listing.reactions.length > 0
                    ? listing.reactions[0].reactionType
                    : null,
            reactions: undefined,
        };

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching listing:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

/**
 * PUT /api/job-listings/[id]
 * Update own job listing.
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        const { id } = await params;
        const listing = await prisma.playerJobListing.findUnique({ where: { id } });

        if (!listing || listing.playerId !== user.player.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const body = await req.json();
        const updated = await prisma.playerJobListing.update({
            where: { id },
            data: {
                category: body.category ?? listing.category,
                category2: body.category2 !== undefined ? body.category2 : listing.category2,
                customCategory: body.customCategory !== undefined ? body.customCategory : listing.customCategory,
                title: body.title?.trim() ?? listing.title,
                description: body.description !== undefined ? body.description?.trim() || null : listing.description,
                phoneNumber: body.phoneNumber?.trim() ?? listing.phoneNumber,
                experience: body.experience !== undefined ? body.experience : listing.experience,
                location: body.location !== undefined ? body.location?.trim() || null : listing.location,
                availability: body.availability !== undefined ? body.availability : listing.availability,
                workingHours: body.workingHours !== undefined ? body.workingHours : listing.workingHours,
                imageUrls: body.imageUrls !== undefined ? body.imageUrls : listing.imageUrls,
                isActive: body.isActive !== undefined ? body.isActive : listing.isActive,
            },
        });

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Error updating listing:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

/**
 * DELETE /api/job-listings/[id]
 * Delete own job listing.
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        const { id } = await params;
        const listing = await prisma.playerJobListing.findUnique({ where: { id } });

        if (!listing || listing.playerId !== user.player.id) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        await prisma.playerJobListing.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "Listing deleted" });
    } catch (error) {
        console.error("Error deleting listing:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
