import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ErrorResponse } from "@/lib/api-response";

/**
 * Centralized error handler for API routes and Server Actions.
 * Catches Prisma, Zod, and auth errors, returning consistent responses.
 */
export function handleApiError(error: unknown) {
    // Zod validation errors
    if (error instanceof ZodError) {
        const messages = error.issues.map((e) => e.message).join(", ");
        return ErrorResponse({
            message: `Validation error: ${messages}`,
            status: 400,
        });
    }

    // Prisma known request errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case "P2002":
                return ErrorResponse({
                    message: "A record with this value already exists",
                    status: 409,
                });
            case "P2025":
                return ErrorResponse({ message: "Record not found", status: 404 });
            case "P2003":
                return ErrorResponse({
                    message: "Related record not found",
                    status: 400,
                });
            default:
                return ErrorResponse({
                    message: `Database error: ${error.code}`,
                    status: 500,
                });
        }
    }

    // Auth errors
    if (error instanceof Error) {
        if (error.message === "Unauthorized") {
            return ErrorResponse({ message: "Unauthorized", status: 401 });
        }
        if (error.message.startsWith("Forbidden")) {
            return ErrorResponse({ message: error.message, status: 403 });
        }
    }

    // Unknown errors
    console.error("[API Error]", error);
    return ErrorResponse({ message: "Internal Server Error", status: 500 });
}

/**
 * Type-safe wrapper for Server Actions.
 * Catches errors and returns { success, message, data } consistently.
 */
export async function safeAction<T>(
    fn: () => Promise<T>
): Promise<{ success: true; data: T } | { success: false; message: string }> {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                message: error.issues.map((e) => e.message).join(", "),
            };
        }
        if (error instanceof Error) {
            return { success: false, message: error.message };
        }
        return { success: false, message: "Something went wrong" };
    }
}
