import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/db/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is admin
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true },
        });

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const subscriptions = await prisma.pushSubscription.findMany({
            include: {
                player: {
                    include: {
                        user: {
                            select: {
                                userName: true,
                                displayName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Transform data for the frontend
        const subscribers = subscriptions.map((sub) => ({
            id: sub.id,
            playerId: sub.playerId,
            userName: sub.player.user.userName,
            displayName: sub.player.user.displayName,
            createdAt: sub.createdAt.toISOString(),
            endpoint: sub.endpoint,
        }));

        return NextResponse.json({ subscribers });
    } catch (error) {
        console.error("Error fetching push subscribers:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscribers" },
            { status: 500 }
        );
    }
}
