import { prisma } from "@/src/lib/db/prisma";
import { clientClerk } from "@/src/lib/clerk/client";
import { updateUser } from "@/src/services/user/updateUser";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
    userName: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be at most 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores").optional(),
});

// GET - Get current user profile
export async function GET(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        return SuccessResponse({
            data: {
                id: user.id,
                userName: user.userName,
                email: user.email,
                role: user.role,
                isEmailLinked: user.isEmailLinked,
                usernameLastChangeAt: user.usernameLastChangeAt,
            },
            message: "Profile fetched successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// PATCH - Update user profile
export async function PATCH(req: NextRequest) {
    try {
        const user = await tokenMiddleware(req);

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        const body = updateProfileSchema.parse(await req.json());

        // Check if username is being updated
        if (body.userName) {
            // Check if it's the same as current username
            if (body.userName === user.userName) {
                return ErrorResponse({
                    message: "This is already your current username",
                    status: 400,
                });
            }

            // Check if username is already taken in our DB
            const existingUser = await prisma.user.findUnique({
                where: { userName: body.userName },
            });

            if (existingUser && existingUser.id !== user.id) {
                return ErrorResponse({
                    message: "Username is already taken",
                    status: 400,
                });
            }

            // Update the username in Clerk first
            try {
                await clientClerk.users.updateUser(user.clerkId, {
                    username: body.userName,
                });
            } catch (clerkError: any) {
                // Handle Clerk-specific errors (e.g., username already taken in Clerk)
                const errorMessage = clerkError?.errors?.[0]?.message || "Failed to update username";
                return ErrorResponse({
                    message: errorMessage,
                    status: 400,
                });
            }
        }

        // Update the user in our database
        const updatedUser = await updateUser({
            where: { id: user.id },
            data: {
                ...(body.userName && {
                    userName: body.userName,
                    usernameLastChangeAt: new Date(),
                }),
            },
        });

        return SuccessResponse({
            data: {
                id: updatedUser.id,
                userName: updatedUser.userName,
                email: updatedUser.email,
                role: updatedUser.role,
                usernameLastChangeAt: updatedUser.usernameLastChangeAt,
            },
            message: "Profile updated successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
