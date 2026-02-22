import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { previewTeamsByPoll } from "@/lib/logic/previewTeamsByPoll";

/**
 * POST /api/polls/teams/preview
 * Generate a team preview from a poll's votes.
 */
export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { pollId, tournamentId, seasonId, groupSize, entryFee } = body;

        if (!pollId || !tournamentId || !seasonId || !groupSize) {
            return NextResponse.json(
                { error: "Missing required fields: pollId, tournamentId, seasonId, groupSize" },
                { status: 400 },
            );
        }

        const preview = await previewTeamsByPoll({
            pollId,
            tournamentId,
            seasonId,
            groupSize,
            entryFee: entryFee ?? 0,
        });

        return NextResponse.json({ data: preview });
    } catch (error: any) {
        console.error("Failed to preview teams:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate preview" },
            { status: 500 },
        );
    }
}
