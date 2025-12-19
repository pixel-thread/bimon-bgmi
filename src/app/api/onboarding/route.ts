"use server";

import { prisma } from "@/src/lib/db/prisma";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { SuccessResponse, ErrorResponse } from "@/src/utils/next-response";
import { clientClerk } from "@/src/lib/clerk/client";
import z from "zod";

const usernameSchema = z.object({
    userName: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
        ),
});

export async function POST(req: Request) {
    try {
        const user = await tokenMiddleware(req);

        // Check if user is already onboarded
        if (user.isOnboarded) {
            return ErrorResponse({
                message: "User is already onboarded",
                status: 400,
            });
        }

        const body = await req.json();
        const { userName } = usernameSchema.parse(body);

        // Check if username is already taken
        const existingUser = await prisma.user.findUnique({
            where: { userName },
        });

        if (existingUser && existingUser.id !== user.id) {
            return ErrorResponse({
                message: "Username is already taken. Please choose a different one.",
                status: 409,
            });
        }

        // Update user in local database
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                userName,
                isOnboarded: true,
                usernameLastChangeAt: new Date(),
            },
            include: {
                player: {
                    include: {
                        characterImage: true,
                        playerBanned: true,
                        uc: true,
                    },
                },
            },
        });

        // Also update username in Clerk
        try {
            await clientClerk.users.updateUser(user.clerkId, {
                username: userName,
            });
        } catch (clerkError) {
            console.error("Failed to update Clerk username:", clerkError);
            // Don't fail the request if Clerk update fails
        }

        return SuccessResponse({
            data: updatedUser,
            message: "Username set successfully! Welcome to PUBGMI Tournament.",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
