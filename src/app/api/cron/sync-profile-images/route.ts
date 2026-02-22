import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/database";

/**
 * GET /api/cron/sync-profile-images
 * 
 * Syncs Clerk profile image URLs to the User table.
 * Run once to backfill missing imageUrl fields.
 */
export async function GET() {

    try {
        // Get all users missing imageUrl
        const usersWithoutImage = await prisma.user.findMany({
            where: { imageUrl: null },
            select: { id: true, clerkId: true, username: true },
        });

        console.log(`Found ${usersWithoutImage.length} users without profile images`);

        const clerk = await clerkClient();
        let updated = 0;
        const errors: string[] = [];

        for (const user of usersWithoutImage) {
            try {
                const clerkUser = await clerk.users.getUser(user.clerkId);
                if (clerkUser.imageUrl) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { imageUrl: clerkUser.imageUrl },
                    });
                    updated++;
                    console.log(`Updated ${user.username}: ${clerkUser.imageUrl}`);
                }
            } catch (err: any) {
                errors.push(`${user.username}: ${err.message}`);
            }
        }

        return NextResponse.json({
            total: usersWithoutImage.length,
            updated,
            errors,
        });
    } catch (error: any) {
        console.error("Sync profile images error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
