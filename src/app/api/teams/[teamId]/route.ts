import { prisma } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH /api/teams/[teamId]
 * Update team players — add or remove players from a team.
 * Body: { addPlayerIds?: string[], removePlayerIds?: string[] }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ teamId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { teamId } = await params;
        const body = await req.json();
        const { addPlayerIds = [], removePlayerIds = [] } = body as {
            addPlayerIds?: string[];
            removePlayerIds?: string[];
        };

        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { players: { select: { id: true } } },
        });

        if (!team) {
            return NextResponse.json({ error: "Team not found" }, { status: 404 });
        }

        const ops: Promise<unknown>[] = [];

        // Add players
        if (addPlayerIds.length > 0) {
            ops.push(
                prisma.team.update({
                    where: { id: teamId },
                    data: {
                        players: {
                            connect: addPlayerIds.map(id => ({ id })),
                        },
                    },
                })
            );
        }

        // Remove players
        if (removePlayerIds.length > 0) {
            ops.push(
                prisma.team.update({
                    where: { id: teamId },
                    data: {
                        players: {
                            disconnect: removePlayerIds.map(id => ({ id })),
                        },
                    },
                })
            );
        }

        await Promise.all(ops);

        // Fetch updated team
        const updated = await prisma.team.findUnique({
            where: { id: teamId },
            include: {
                players: {
                    select: {
                        id: true,
                        displayName: true,
                        user: { select: { username: true } },
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: `Team updated: +${addPlayerIds.length} added, -${removePlayerIds.length} removed`,
            data: {
                id: updated?.id,
                playerCount: updated?.players.length ?? 0,
                players: updated?.players.map(p => ({
                    id: p.id,
                    name: p.displayName || p.user.username,
                })),
            },
        });
    } catch (error) {
        console.error("Error updating team:", error);
        return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
    }
}
