import { NextResponse } from "next/server";

interface SuccessResponseOptions {
    data?: unknown;
    message?: string;
    meta?: Record<string, unknown>;
    status?: number;
    /** Cache-Control header value */
    cache?: string;
}

/**
 * Standard success response for API routes.
 */
export function SuccessResponse({
    data = null,
    message = "Success",
    meta,
    status = 200,
    cache,
}: SuccessResponseOptions = {}) {
    const response = NextResponse.json(
        {
            success: true,
            message,
            data,
            ...(meta && { meta }),
        },
        { status }
    );

    if (cache) {
        response.headers.set("Cache-Control", cache);
    }

    return response;
}

interface ErrorResponseOptions {
    message?: string;
    status?: number;
    error?: unknown;
}

/**
 * Standard error response for API routes.
 */
export function ErrorResponse({
    message = "Internal Server Error",
    status = 500,
    error,
}: ErrorResponseOptions = {}) {
    // Log server-side for debugging
    if (error) {
        console.error(`[API Error] ${message}:`, error);
    }

    return NextResponse.json(
        {
            success: false,
            message,
            data: null,
        },
        { status }
    );
}

/**
 * Common cache presets for API routes.
 * Used by the service worker for offline caching.
 */
export const CACHE = {
    /** Cache for 60s, serve stale for 5min while revalidating */
    SHORT: "public, s-maxage=60, stale-while-revalidate=300",
    /** Cache for 5min, serve stale for 30min */
    MEDIUM: "public, s-maxage=300, stale-while-revalidate=1800",
    /** Cache for 1 hour, serve stale for 24 hours */
    LONG: "public, s-maxage=3600, stale-while-revalidate=86400",
    /** No caching */
    NONE: "no-cache, no-store, must-revalidate",
} as const;
