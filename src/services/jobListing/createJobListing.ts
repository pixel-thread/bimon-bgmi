import { prisma } from "@/src/lib/db/prisma";

export interface CreateJobListingInput {
    playerId: string;
    category: string;
    category2?: string;
    customCategory?: string;
    title: string;
    description?: string;
    phoneNumber: string;
    experience?: string;
}

/**
 * Create a new job listing for a player
 */
export async function createJobListing(data: CreateJobListingInput) {
    // Validate title length
    if (data.title.length > 50) {
        throw new Error("Title must be 50 characters or less");
    }

    // Validate description length
    if (data.description && data.description.length > 150) {
        throw new Error("Description must be 150 characters or less");
    }

    // Validate phone number
    if (!data.phoneNumber || data.phoneNumber.trim().length === 0) {
        throw new Error("Phone number is required");
    }

    return prisma.playerJobListing.create({
        data: {
            playerId: data.playerId,
            category: data.category,
            category2: data.category2 || null,
            customCategory: data.category === "Other" ? data.customCategory : null,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            phoneNumber: data.phoneNumber.trim(),
            experience: data.experience || null,
            isActive: true,
        },
    });
}

