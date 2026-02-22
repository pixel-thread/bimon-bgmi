import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createTeamsByPoll } from "@/lib/logic/createTeamsByPoll";

/**
 * POST /api/polls/teams/create
 * Create teams from a poll. Optionally uses pre-confirmed preview team arrangements.
 */
export async function POST(req: NextRequest) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { pollId, tournamentId, seasonId, groupSize, entryFee, previewTeams } = body;

        if (!pollId || !tournamentId || !seasonId || !groupSize) {
            return NextResponse.json(
                { error: "Missing required fields: pollId, tournamentId, seasonId, groupSize" },
                { status: 400 },
            );
        }

        const result = await createTeamsByPoll({
            pollId,
            tournamentId,
            seasonId,
            groupSize,
            entryFee: entryFee ?? 0,
            previewTeams,
        });

        return NextResponse.json({ data: result });
    } catch (error: any) {
        console.error("Failed to create teams:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create teams" },
            { status: 500 },
        );
    }
}
