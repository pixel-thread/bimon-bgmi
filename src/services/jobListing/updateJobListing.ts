import { prisma } from "@/src/lib/db/prisma";

export interface UpdateJobListingInput {
    id: string;
    playerId: string; // For ownership verification
    category?: string;
    customCategory?: string;
    title?: string;
    description?: string;
    phoneNumber?: string;
    isActive?: boolean;
    location?: string;
    availability?: string;
    workingHours?: Record<string, string>;
    imageUrls?: string[];
}

/**
 * Update a job listing (only if owned by the player)
 */
export async function updateJobListing(data: UpdateJobListingInput) {
    // Verify ownership
    const existingListing = await prisma.playerJobListing.findFirst({
        where: {
            id: data.id,
            playerId: data.playerId,
        },
    });

    if (!existingListing) {
        throw new Error("Job listing not found or not owned by you");
    }

    // Validate title length if provided
    if (data.title && data.title.length > 50) {
        throw new Error("Title must be 50 characters or less");
    }

    // Validate description length if provided
    if (data.description && data.description.length > 150) {
        throw new Error("Description must be 150 characters or less");
    }

    return prisma.playerJobListing.update({
        where: {
            id: data.id,
        },
        data: {
            ...(data.category && { category: data.category }),
            ...(data.category === "Other"
                ? { customCategory: data.customCategory }
                : { customCategory: null }),
            ...(data.title && { title: data.title.trim() }),
            ...(data.description !== undefined && {
                description: data.description?.trim() || null,
            }),
            ...(data.phoneNumber && { phoneNumber: data.phoneNumber.trim() }),
            ...(data.isActive !== undefined && { isActive: data.isActive }),
            ...(data.location !== undefined && { location: data.location?.trim() || null }),
            ...(data.availability !== undefined && { availability: data.availability || null }),
            ...(data.workingHours !== undefined && { workingHours: data.workingHours || null }),
            ...(data.imageUrls !== undefined && { imageUrls: data.imageUrls?.slice(0, 3) || [] }),
        },
    });
}
