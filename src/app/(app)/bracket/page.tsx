"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BracketView, MyBracketMatch } from "@/components/bracket/bracket-view";
import { SubmitResultModal } from "@/components/bracket/submit-result-modal";
import { ViewResultModal } from "@/components/bracket/view-result-modal";
import { useConfirmResult, useDisputeResult } from "@/components/bracket/submit-result-modal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Trophy, Swords, Loader2 } from "lucide-react";
import { Chip } from "@heroui/react";

/**
 * /bracket — Live bracket page.
 * Shows the active tournament's bracket with real data.
 */
export default function BracketPage() {
    const { user } = useAuthUser();
    const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
    const [viewingMatch, setViewingMatch] = useState<string | null>(null);
    const playerId = user?.player?.id;

    // Fetch active bracket tournament
    const { data, isLoading, error } = useQuery({
        queryKey: ["active-bracket"],
        queryFn: async () => {
            const res = await fetch("/api/tournaments?type=BRACKET_1V1&status=ACTIVE,IN_PROGRESS");
            if (!res.ok) return null;
            const json = await res.json();
            return json.data?.[0] ?? null; // Latest active bracket tournament
        },
    });

    const tournamentId = data?.id;

    // Fetch bracket data for the tournament
    const { data: bracketData, isLoading: bracketLoading } = useQuery({
        queryKey: ["bracket", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/tournaments/${tournamentId}/bracket`);
            if (!res.ok) return null;
            const json = await res.json();
            return json.data;
        },
        enabled: !!tournamentId,
    });

    const confirmResult = useConfirmResult(tournamentId ?? "");
    const disputeResult = useDisputeResult(tournamentId ?? "");

    // Find match data for view result modal
    const allMatches = bracketData?.rounds?.flatMap((r: any) => r.matches) ?? [];
    const viewMatch = viewingMatch ? allMatches.find((m: any) => m.id === viewingMatch) : null;
    const viewMatchData = viewMatch ? {
        id: viewMatch.id,
        player1: viewMatch.player1?.displayName ?? null,
        player2: viewMatch.player2?.displayName ?? null,
        player1Avatar: viewMatch.player1Avatar,
        player2Avatar: viewMatch.player2Avatar,
        score1: viewMatch.score1,
        score2: viewMatch.score2,
        winnerId: viewMatch.winnerId,
        player1Id: viewMatch.player1Id,
        player2Id: viewMatch.player2Id,
        status: viewMatch.status,
        screenshotUrl: viewMatch.results?.[0]?.screenshotUrl ?? null,
    } : null;

    // Loading state
    if (isLoading || bracketLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-foreground/50">Loading bracket...</p>
            </div>
        );
    }

    // No active tournament
    if (!data || !tournamentId) {
        return (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
                <div className="p-4 rounded-2xl bg-foreground/5">
                    <Swords className="h-12 w-12 text-foreground/20" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">No Tournament Active</h2>
                    <p className="text-sm text-foreground/50 mt-1">
                        Check the Vote page for upcoming tournaments
                    </p>
                </div>
            </div>
        );
    }

    // Tournament exists but no bracket yet
    if (!bracketData?.rounds || bracketData.rounds.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-divider">
                    <Swords className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{data.name}</p>
                        <p className="text-xs text-foreground/50">Bracket not generated yet</p>
                    </div>
                    <Chip size="sm" color="warning" variant="dot">Waiting</Chip>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Tournament Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-divider">
                <Swords className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold">{data.name}</p>
                    <p className="text-xs text-foreground/50">
                        {bracketData.totalPlayers} Players • {bracketData.totalRounds} Rounds
                    </p>
                </div>
                <Chip size="sm" color="success" variant="dot">In Progress</Chip>
            </div>

            {/* My Current Match */}
            {playerId && (
                <MyBracketMatch
                    rounds={bracketData.rounds}
                    currentPlayerId={playerId}
                    onSubmitResult={(id) => setSelectedMatch(id)}
                    onConfirmResult={(id) => confirmResult.mutate(id)}
                    onDispute={(id) => disputeResult.mutate(id)}
                />
            )}

            {/* Full Bracket */}
            <div>
                <h2 className="text-lg font-bold mb-4">Tournament Bracket</h2>
                <BracketView
                    rounds={bracketData.rounds}
                    totalRounds={bracketData.totalRounds}
                    currentPlayerId={playerId}
                    onSubmitResult={(id) => setSelectedMatch(id)}
                    onConfirmResult={(id) => confirmResult.mutate(id)}
                    onDispute={(id) => disputeResult.mutate(id)}
                    onViewResult={(id) => setViewingMatch(id)}
                />
            </div>

            {/* Winner banner */}
            {bracketData.winner && (
                <div className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border border-yellow-500/20">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                    <div className="text-center">
                        <p className="text-xs text-yellow-600/60 uppercase font-bold tracking-wider">Champion</p>
                        <p className="text-xl font-black text-yellow-500">{bracketData.winner.displayName}</p>
                    </div>
                    <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
            )}

            {/* Submit Result Modal */}
            {selectedMatch && (
                <SubmitResultModal
                    matchId={selectedMatch}
                    tournamentId={tournamentId}
                    isOpen={!!selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}

            {/* View Result Modal */}
            <ViewResultModal
                isOpen={!!viewingMatch}
                onClose={() => setViewingMatch(null)}
                match={viewMatchData}
            />
        </div>
    );
}
