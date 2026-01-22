import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_DRIVE_REDIRECT_URI!;

/**
 * GET /api/auth/google-drive/callback
 * Handles OAuth callback from Google, exchanges code for tokens, stores in DB
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state"); // This is the userId
        const error = searchParams.get("error");

        if (error) {
            console.error("Google OAuth error:", error);
            return NextResponse.redirect(
                new URL("/profile?drive_error=access_denied", req.url)
            );
        }

        if (!code || !state) {
            return NextResponse.redirect(
                new URL("/profile?drive_error=missing_params", req.url)
            );
        }

        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                grant_type: "authorization_code",
                redirect_uri: GOOGLE_REDIRECT_URI,
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error("Token exchange failed:", errorData);
            return NextResponse.redirect(
                new URL("/profile?drive_error=token_exchange_failed", req.url)
            );
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token, expires_in } = tokens;

        // Calculate expiry time
        const expiryDate = new Date(Date.now() + expires_in * 1000);

        // Find the player by clerkId (state)
        const user = await prisma.user.findUnique({
            where: { clerkId: state },
            include: { player: true },
        });

        if (!user?.player) {
            return NextResponse.redirect(
                new URL("/profile?drive_error=player_not_found", req.url)
            );
        }

        // Store tokens in database
        await prisma.player.update({
            where: { id: user.player.id },
            data: {
                googleDriveToken: access_token,
                googleDriveRefresh: refresh_token || user.player.googleDriveRefresh, // Keep old refresh if not provided
                googleDriveExpiry: expiryDate,
            },
        });

        // Redirect back to profile with success
        return NextResponse.redirect(
            new URL("/profile?drive_connected=true", req.url)
        );
    } catch (error) {
        console.error("Error in Google Drive callback:", error);
        return NextResponse.redirect(
            new URL("/profile?drive_error=server_error", req.url)
        );
    }
}
