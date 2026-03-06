"use client";

import { useState } from "react";
import { BracketView, MyBracketMatch } from "@/components/bracket/bracket-view";
import { SubmitResultModal } from "@/components/bracket/submit-result-modal";
import { Trophy, Swords } from "lucide-react";
import { Chip } from "@heroui/react";

/**
 * /bracket/demo — Demo page to preview the bracket UI with dummy data.
 * No real API calls. Shows a realistic 8-player single-elimination bracket.
 */

const CURRENT_PLAYER_ID = "p3"; // Simulate being player 3

const DUMMY_ROUNDS = [
    {
        round: 1,
        name: "Quarter-Finals",
        matches: [
            {
                id: "m1",
                round: 1,
                position: 0,
                player1Id: "p1",
                player2Id: "p2",
                winnerId: "p1",
                score1: 3,
                score2: 1,
                status: "CONFIRMED" as const,
                disputeDeadline: null,
                player1: { id: "p1", displayName: "KingMessi10", userId: "u1" },
                player2: { id: "p2", displayName: "CR7_Legend", userId: "u2" },
                player1Avatar: null,
                player2Avatar: null,
                winner: { id: "p1", displayName: "KingMessi10" },
                results: [],
            },
            {
                id: "m2",
                round: 1,
                position: 1,
                player1Id: "p3",
                player2Id: "p4",
                winnerId: null,
                score1: null,
                score2: null,
                status: "PENDING" as const,
                disputeDeadline: null,
                player1: { id: "p3", displayName: "NeymarSkillz", userId: "u3" },
                player2: { id: "p4", displayName: "MbappeSpeed", userId: "u4" },
                player1Avatar: null,
                player2Avatar: null,
                winner: null,
                results: [],
            },
            {
                id: "m3",
                round: 1,
                position: 2,
                player1Id: "p5",
                player2Id: "p6",
                winnerId: "p5",
                score1: 2,
                score2: 0,
                status: "CONFIRMED" as const,
                disputeDeadline: null,
                player1: { id: "p5", displayName: "HaalandBeast", userId: "u5" },
                player2: { id: "p6", displayName: "SalahKing", userId: "u6" },
                player1Avatar: null,
                player2Avatar: null,
                winner: { id: "p5", displayName: "HaalandBeast" },
                results: [],
            },
            {
                id: "m4",
                round: 1,
                position: 3,
                player1Id: "p7",
                player2Id: null,
                winnerId: "p7",
                score1: null,
                score2: null,
                status: "BYE" as const,
                disputeDeadline: null,
                player1: { id: "p7", displayName: "ViníciusJR", userId: "u7" },
                player2: null,
                player1Avatar: null,
                player2Avatar: null,
                winner: { id: "p7", displayName: "ViníciusJR" },
                results: [],
            },
        ],
    },
    {
        round: 2,
        name: "Semi-Finals",
        matches: [
            {
                id: "m5",
                round: 2,
                position: 0,
                player1Id: "p1",
                player2Id: null,
                winnerId: null,
                score1: null,
                score2: null,
                status: "PENDING" as const,
                disputeDeadline: null,
                player1: { id: "p1", displayName: "KingMessi10", userId: "u1" },
                player2: null,
                player1Avatar: null,
                player2Avatar: null,
                winner: null,
                results: [],
            },
            {
                id: "m6",
                round: 2,
                position: 1,
                player1Id: "p5",
                player2Id: "p7",
                winnerId: "p5",
                score1: 4,
                score2: 2,
                status: "SUBMITTED" as const,
                disputeDeadline: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                player1: { id: "p5", displayName: "HaalandBeast", userId: "u5" },
                player2: { id: "p7", displayName: "ViníciusJR", userId: "u7" },
                player1Avatar: null,
                player2Avatar: null,
                winner: null,
                results: [
                    {
                        id: "r1",
                        submittedById: "p5",
                        claimedScore1: 4,
                        claimedScore2: 2,
                        screenshotUrl: null,
                        isDispute: false,
                        createdAt: new Date().toISOString(),
                    },
                ],
            },
        ],
    },
    {
        round: 3,
        name: "Final",
        matches: [
            {
                id: "m7",
                round: 3,
                position: 0,
                player1Id: null,
                player2Id: null,
                winnerId: null,
                score1: null,
                score2: null,
                status: "PENDING" as const,
                disputeDeadline: null,
                player1: null,
                player2: null,
                player1Avatar: null,
                player2Avatar: null,
                winner: null,
                results: [],
            },
        ],
    },
];

export default function BracketDemoPage() {
    const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
                {/* Header */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-warning-500/10">
                            <Trophy className="h-6 w-6 text-warning-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">1v1 Bracket Preview</h1>
                            <p className="text-sm text-foreground/50">
                                Demo bracket with 7 players — single elimination
                            </p>
                        </div>
                        <Chip color="warning" variant="flat" size="sm" className="ml-auto">
                            DEMO MODE
                        </Chip>
                    </div>
                </div>

                {/* Tournament Info Bar */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-divider">
                    <Swords className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold">eFootball Cup #1</p>
                        <p className="text-xs text-foreground/50">Season 1 • 7 Players • 3 Rounds</p>
                    </div>
                    <Chip size="sm" color="success" variant="dot">In Progress</Chip>
                </div>

                {/* My Current Match */}
                <div>
                    <MyBracketMatch
                        rounds={DUMMY_ROUNDS}
                        currentPlayerId={CURRENT_PLAYER_ID}
                        onSubmitResult={(id) => setSelectedMatch(id)}
                        onConfirmResult={(id) => alert(`Confirm match: ${id}`)}
                        onDispute={(id) => alert(`Dispute match: ${id}`)}
                    />
                </div>

                {/* Full Bracket */}
                <div>
                    <h2 className="text-lg font-bold mb-4">Tournament Bracket</h2>
                    <BracketView
                        rounds={DUMMY_ROUNDS}
                        totalRounds={3}
                        currentPlayerId={CURRENT_PLAYER_ID}
                        onSubmitResult={(id) => setSelectedMatch(id)}
                        onConfirmResult={(id) => alert(`Confirm match: ${id}`)}
                        onDispute={(id) => alert(`Dispute match: ${id}`)}
                        onViewResult={(id) => alert(`View result for match: ${id}\n\nThis would show the screenshot proof and scores.`)}
                    />
                </div>

                {/* Legend */}
                <div className="p-4 rounded-2xl bg-foreground/5 border border-divider space-y-3">
                    <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Status Legend</p>
                    <div className="flex flex-wrap gap-3">
                        <Chip size="sm" variant="flat" color="default">⏳ Pending</Chip>
                        <Chip size="sm" variant="flat" color="warning">⏰ Awaiting Confirmation</Chip>
                        <Chip size="sm" variant="flat" color="danger">⚠️ Disputed</Chip>
                        <Chip size="sm" variant="flat" color="success">✅ Confirmed</Chip>
                        <Chip size="sm" variant="flat" color="secondary">— Bye</Chip>
                    </div>
                    <div className="text-xs text-foreground/40 space-y-1">
                        <p>• <span className="text-primary font-medium">Blue border</span> = Your active match</p>
                        <p>• <span className="text-success font-medium">Green highlight</span> = Winner</p>
                        <p>• After submitting a result, opponent has <strong>30 minutes</strong> to confirm or dispute</p>
                    </div>
                </div>

                {/* Result modal (for demo - won't actually submit) */}
                {selectedMatch && (
                    <SubmitResultModal
                        matchId={selectedMatch}
                        isOpen={!!selectedMatch}
                        onClose={() => setSelectedMatch(null)}
                    />
                )}
            </div>
        </div>
    );
}
