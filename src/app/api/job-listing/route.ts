import { getJobListings } from "@/src/services/jobListing/getJobListings";
import { createJobListing } from "@/src/services/jobListing/createJobListing";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/src/lib/db/prisma";

const createJobListingSchema = z.object({
    category: z.string().min(1, "Category is required"),
    category2: z.string().optional(),
    customCategory: z.string().max(30, "Custom category must be 30 characters or less").optional(),
    title: z.string().min(1, "Title is required").max(50, "Title must be 50 characters or less"),
    description: z.string().max(150, "Description must be 150 characters or less").optional(),
    phoneNumber: z.string().min(1, "Phone number is required"),
    experience: z.string().optional(),
});

// GET - Get all active job listings for banner
export async function GET() {
    try {
        const listings = await getJobListings();

        return SuccessResponse({
            data: listings,
            message: "Job listings fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// POST - Create a new job listing
export async function POST(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        // Get player from user
        const player = await prisma.player.findUnique({
            where: { userId: user.id },
        });

        if (!player) {
            return ErrorResponse({ message: "Player not found", status: 404 });
        }

        const body = createJobListingSchema.parse(await req.json());

        const listing = await createJobListing({
            playerId: player.id,
            category: body.category,
            category2: body.category2,
            customCategory: body.customCategory,
            title: body.title,
            description: body.description,
            phoneNumber: body.phoneNumber,
            experience: body.experience,
        });

        // Predefined categories
        const PREDEFINED_CATEGORIES = [
            "Painter", "Shopkeeper", "Driver", "Electrician", "Plumber",
            "Mechanic", "Tutor/Teacher", "Delivery", "Carpenter", "Tailor", "Cook/Chef", "Other"
        ];

        // Save any custom categories (not in predefined list) to DB for others to use
        const categoriesToSave = [body.category, body.category2].filter(
            (cat): cat is string => !!cat && !PREDEFINED_CATEGORIES.includes(cat)
        );

        for (const catName of categoriesToSave) {
            try {
                await prisma.jobCategory.upsert({
                    where: { name: catName },
                    update: {}, // No update needed if exists
                    create: { name: catName },
                });
            } catch {
                // Ignore duplicate errors
            }
        }

        return SuccessResponse({
            data: listing,
            message: "Job listing created successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
