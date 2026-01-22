import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET!;

/**
 * Refresh access token if expired
 */
async function refreshTokenIfNeeded(playerId: string, refreshToken: string): Promise<string | null> {
    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) {
            console.error("Token refresh failed");
            return null;
        }

        const tokens = await response.json();
        const expiryDate = new Date(Date.now() + tokens.expires_in * 1000);

        // Update tokens in database
        await prisma.player.update({
            where: { id: playerId },
            data: {
                googleDriveToken: tokens.access_token,
                googleDriveExpiry: expiryDate,
            },
        });

        return tokens.access_token;
    } catch (error) {
        console.error("Error refreshing token:", error);
        return null;
    }
}

/**
 * POST /api/drive/upload
 * Uploads a file to user's Google Drive
 * Body: FormData with 'file' field
 * Returns: { url: string } - The shareable file URL
 */
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get player with Drive tokens
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { player: true },
        });

        if (!user?.player) {
            return NextResponse.json({ error: "Player not found" }, { status: 404 });
        }

        const { googleDriveToken, googleDriveRefresh, googleDriveExpiry } = user.player;

        if (!googleDriveToken || !googleDriveRefresh) {
            return NextResponse.json(
                { error: "Google Drive not connected", needsAuth: true },
                { status: 401 }
            );
        }

        // Check if token is expired and refresh if needed
        let accessToken = googleDriveToken;
        if (googleDriveExpiry && new Date(googleDriveExpiry) <= new Date()) {
            const newToken = await refreshTokenIfNeeded(user.player.id, googleDriveRefresh);
            if (!newToken) {
                return NextResponse.json(
                    { error: "Failed to refresh token, please reconnect Google Drive", needsAuth: true },
                    { status: 401 }
                );
            }
            accessToken = newToken;
        }

        // Parse the uploaded file
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
        }

        const fileBuffer = await file.arrayBuffer();

        // Step 1: Create file metadata on Drive
        const metadata = {
            name: `bimon_${Date.now()}_${file.name}`,
            mimeType: file.type,
        };

        // Create multipart body
        const boundary = "boundary_" + Date.now();
        const body = createMultipartBody(metadata, new Uint8Array(fileBuffer), file.type, boundary);

        // Upload file to Google Drive using multipart upload
        const uploadResponse = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": `multipart/related; boundary=${boundary}`,
                },
                body: body,
            }
        );

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error("Drive upload failed:", errorText);
            return NextResponse.json(
                { error: "Failed to upload to Google Drive" },
                { status: 500 }
            );
        }

        const uploadedFile = await uploadResponse.json();

        // Step 2: Make the file publicly accessible
        await fetch(
            `https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    role: "reader",
                    type: "anyone",
                }),
            }
        );

        // Generate the direct view URL
        const imageUrl = `https://drive.google.com/uc?export=view&id=${uploadedFile.id}`;

        return NextResponse.json({
            success: true,
            url: imageUrl,
            fileId: uploadedFile.id,
        });
    } catch (error) {
        console.error("Error uploading to Drive:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}

/**
 * Creates a multipart body for Google Drive API upload
 */
function createMultipartBody(metadata: object, fileData: Uint8Array, mimeType: string, boundary: string): Blob {
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    // Build the multipart body as a string + binary
    const metadataPart =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata);

    const filePart =
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`;

    // Use Blob to combine text and binary parts - convert Uint8Array to ArrayBuffer
    const arrayBuffer = fileData.buffer.slice(fileData.byteOffset, fileData.byteOffset + fileData.byteLength) as ArrayBuffer;
    return new Blob([
        metadataPart,
        filePart,
        arrayBuffer,
        closeDelimiter,
    ]);
}

/**
 * GET /api/drive/upload
 * Check if user has Google Drive connected
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { player: true },
        });

        const isConnected = !!(
            user?.player?.googleDriveToken && user?.player?.googleDriveRefresh
        );

        return NextResponse.json({ connected: isConnected });
    } catch (error) {
        console.error("Error checking Drive status:", error);
        return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
    }
}
