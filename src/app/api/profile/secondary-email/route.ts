import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { type NextRequest } from "next/server";

/**
 * POST /api/profile/secondary-email
 * Manage secondary email — add, remove, or swap to primary.
 *
 * Actions:
 *   ADD    — link a secondary Gmail (must not be used by another user)
 *   REMOVE — unlink the secondary email
 *   SWAP   — promote secondary to primary, demote old primary to secondary
 */
export async function POST(request: NextRequest) {
    try {
        const sessionEmail = await getAuthEmail();
        if (!sessionEmail) {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }

        const body = await request.json();
        const { action, email: newEmail } = body as {
            action: "ADD" | "REMOVE" | "SWAP";
            email?: string;
        };

        if (!["ADD", "REMOVE", "SWAP"].includes(action)) {
            return ErrorResponse({ message: "Invalid action", status: 400 });
        }

        // Find the user by session email (could be primary or secondary)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: sessionEmail },
                    { secondaryEmail: sessionEmail },
                ],
            },
            select: { id: true, email: true, secondaryEmail: true },
        });

        if (!user) {
            return ErrorResponse({ message: "User not found", status: 404 });
        }

        switch (action) {
            case "ADD": {
                if (!newEmail || !newEmail.includes("@")) {
                    return ErrorResponse({ message: "Valid email required", status: 400 });
                }

                if (user.secondaryEmail) {
                    return ErrorResponse({
                        message: "You already have a secondary email. Remove it first.",
                        status: 400,
                    });
                }

                const trimmed = newEmail.trim().toLowerCase();

                if (trimmed === user.email) {
                    return ErrorResponse({ message: "This is already your primary email", status: 400 });
                }

                // Check if email is used by another user (primary or secondary)
                const existing = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: trimmed },
                            { secondaryEmail: trimmed },
                        ],
                        NOT: { id: user.id },
                    },
                    select: { id: true },
                });

                if (existing) {
                    return ErrorResponse({
                        message: "This email is already used by another account",
                        status: 409,
                    });
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: { secondaryEmail: trimmed },
                });

                return SuccessResponse({
                    data: { secondaryEmail: trimmed },
                    message: "Secondary email added! You can now log in with either email.",
                });
            }

            case "REMOVE": {
                if (!user.secondaryEmail) {
                    return ErrorResponse({ message: "No secondary email to remove", status: 400 });
                }

                // If the session email IS the secondary being removed, the
                // session will become orphaned.  Allow it but tell the client
                // to sign out so the user re-authenticates with the new primary.
                const sessionIsSecondary =
                    user.secondaryEmail.toLowerCase() === sessionEmail.toLowerCase();

                await prisma.user.update({
                    where: { id: user.id },
                    data: { secondaryEmail: null },
                });

                return SuccessResponse({
                    data: { secondaryEmail: null, requireSignOut: sessionIsSecondary },
                    message: sessionIsSecondary
                        ? "Email removed. Signing you out — sign back in with your new primary email."
                        : "Secondary email removed.",
                });
            }

            case "SWAP": {
                if (!user.secondaryEmail || !user.email) {
                    return ErrorResponse({
                        message: "Need both primary and secondary emails to swap",
                        status: 400,
                    });
                }

                const oldPrimary = user.email;
                const oldSecondary = user.secondaryEmail;

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email: oldSecondary,
                        secondaryEmail: oldPrimary,
                    },
                });

                return SuccessResponse({
                    data: { email: oldSecondary, secondaryEmail: oldPrimary },
                    message: `Primary email changed to ${oldSecondary}. Old primary is now secondary.`,
                });
            }

            default:
                return ErrorResponse({ message: "Invalid action", status: 400 });
        }
    } catch (error) {
        return ErrorResponse({ message: "Failed to update email", error });
    }
}
