import { prisma } from "@/src/lib/db/prisma";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { adminMiddleware } from "@/src/utils/middleware/adminMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";
import { NextRequest } from "next/server";
import { writeFile, unlink, readdir } from "fs/promises";
import path from "path";

const SOUND_DIR = path.join(process.cwd(), "public");
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".ogg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Helper to find existing notification sound file
async function findExistingSound(): Promise<string | null> {
    try {
        const files = await readdir(SOUND_DIR);
        for (const file of files) {
            if (file.startsWith("notification-sound")) {
                const ext = path.extname(file).toLowerCase();
                if (ALLOWED_EXTENSIONS.includes(ext)) {
                    return file;
                }
            }
        }
    } catch {
        // Directory doesn't exist or can't be read
    }
    return null;
}

// GET - Get current notification sound status
export async function GET(req: NextRequest) {
    try {
        await adminMiddleware(req);

        const existingFile = await findExistingSound();

        if (existingFile) {
            return SuccessResponse({
                data: {
                    hasCustomSound: true,
                    fileName: existingFile,
                    url: `/${existingFile}`,
                },
                message: "Notification sound found",
            });
        }

        return SuccessResponse({
            data: {
                hasCustomSound: false,
                fileName: null,
                url: null,
            },
            message: "No custom notification sound",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// POST - Upload new notification sound
export async function POST(req: NextRequest) {
    try {
        await adminMiddleware(req);

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return ErrorResponse({ message: "No file provided", status: 400 });
        }

        // Validate file type
        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return ErrorResponse({
                message: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
                status: 400,
            });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return ErrorResponse({
                message: "File too large. Maximum size is 5MB",
                status: 400,
            });
        }

        // Remove existing sound file if any
        const existingFile = await findExistingSound();
        if (existingFile) {
            try {
                await unlink(path.join(SOUND_DIR, existingFile));
            } catch {
                // Ignore if file doesn't exist
            }
        }

        // Save new file
        const fileName = `notification-sound${ext}`;
        const filePath = path.join(SOUND_DIR, fileName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        return SuccessResponse({
            data: {
                hasCustomSound: true,
                fileName,
                url: `/${fileName}`,
            },
            message: "Notification sound uploaded successfully",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}

// DELETE - Remove custom notification sound
export async function DELETE(req: NextRequest) {
    try {
        await adminMiddleware(req);

        const existingFile = await findExistingSound();

        if (!existingFile) {
            return ErrorResponse({
                message: "No custom notification sound to delete",
                status: 404,
            });
        }

        await unlink(path.join(SOUND_DIR, existingFile));

        return SuccessResponse({
            data: {
                hasCustomSound: false,
                fileName: null,
                url: null,
            },
            message: "Notification sound deleted",
        });
    } catch (error) {
        return handleApiErrors(error);
    }
}
