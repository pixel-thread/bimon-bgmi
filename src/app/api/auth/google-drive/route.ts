import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI!;

// Scopes needed for uploading files to user's Drive
const SCOPES = [
    "https://www.googleapis.com/auth/drive.file", // Create/upload files only (limited access)
];

/**
 * GET /api/auth/google-drive
 * Initiates Google OAuth flow for Drive access
 * Returns the authorization URL to redirect user to
 */
export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Build Google OAuth URL
        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
        authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", SCOPES.join(" "));
        authUrl.searchParams.set("access_type", "offline"); // Get refresh token
        authUrl.searchParams.set("prompt", "consent"); // Always show consent to get refresh token
        authUrl.searchParams.set("state", userId); // Pass userId to callback

        return NextResponse.json({ authUrl: authUrl.toString() });
    } catch (error) {
        console.error("Error initiating Google Drive auth:", error);
        return NextResponse.json(
            { error: "Failed to initiate Google Drive authorization" },
            { status: 500 }
        );
    }
}
