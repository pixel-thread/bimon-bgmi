import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/job-listings
 * Fetch all active job listings with player info and user's reaction.
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        const playerId = user?.player?.id;

        const listings = await prisma.playerJobListing.findMany({
            where: { isActive: true, isJobBanned: false },
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
            orderBy: { createdAt: "desc" },
        });

        const data = listings.map((listing) => ({
            ...listing,
            userReaction:
                listing.reactions && listing.reactions.length > 0
                    ? listing.reactions[0].reactionType
                    : null,
            reactions: undefined,
        }));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching job listings:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

/**
 * POST /api/job-listings
 * Create a new job listing for the current player.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        // Check if player already has a listing
        const existing = await prisma.playerJobListing.findUnique({
            where: { playerId: user.player.id },
        });
        if (existing) {
            return NextResponse.json(
                { error: "You already have a listing. Edit or delete it first." },
                { status: 400 }
            );
        }

        const body = await req.json();
        const {
            category,
            category2,
            customCategory,
            title,
            description,
            phoneNumber,
            experience,
            location,
            availability,
            workingHours,
            imageUrls,
        } = body;

        if (!category || !title?.trim() || !phoneNumber?.trim()) {
            return NextResponse.json(
                { error: "Category, title, and phone number are required" },
                { status: 400 }
            );
        }

        const listing = await prisma.playerJobListing.create({
            data: {
                playerId: user.player.id,
                category,
                category2: category2 || null,
                customCategory: customCategory || null,
                title: title.trim(),
                description: description?.trim() || null,
                phoneNumber: phoneNumber.trim(),
                experience: experience || null,
                location: location?.trim() || null,
                availability: availability || null,
                workingHours: workingHours || null,
                imageUrls: imageUrls || [],
            },
        });

        // If custom category, save it to JobCategory
        if (category === "Other" && customCategory?.trim()) {
            await prisma.jobCategory.upsert({
                where: { name: customCategory.trim() },
                update: {},
                create: { name: customCategory.trim() },
            });
        }

        return NextResponse.json({ success: true, data: listing });
    } catch (error) {
        console.error("Error creating job listing:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
