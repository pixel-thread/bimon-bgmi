import { NextRequest } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";

// Predefined categories
const PREDEFINED_CATEGORIES = [
    "Painter",
    "Shopkeeper",
    "Driver",
    "Electrician",
    "Plumber",
    "Mechanic",
    "Tutor/Teacher",
    "Delivery",
    "Carpenter",
    "Tailor",
    "Cook/Chef",
];

// GET /api/job-categories - Get all categories (predefined + custom)
export async function GET(req: NextRequest) {
    try {
        // Fetch custom categories from database
        const customCategories = await prisma.jobCategory.findMany({
            orderBy: { name: "asc" },
        });

        // Merge predefined and custom categories
        const allCategories = [
            ...PREDEFINED_CATEGORIES,
            ...customCategories.map((c) => c.name),
            "Other", // Always at the end
        ];

        // Remove duplicates (in case a custom matches predefined)
        const uniqueCategories = [...new Set(allCategories)];

        return SuccessResponse({
            data: uniqueCategories,
            message: "Categories fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
