"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BracketView, MyBracketMatch } from "@/components/bracket/bracket-view";
import { SubmitResultModal } from "@/components/bracket/submit-result-modal";
import { ViewResultModal } from "@/components/bracket/view-result-modal";
import { useConfirmResult, useDisputeResult } from "@/components/bracket/submit-result-modal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Trophy, Swords, Loader2 } from "lucide-react";
import { Chip, Tabs, Tab } from "@heroui/react";

/**
 * /bracket — Matches page.
 * Shows all active tournaments with tabs to switch between them.
 */
export default function MatchesPage() {
    const { user, isAdmin } = useAuthUser();
    const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
    const [viewingMatch, setViewingMatch] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("");
    const playerId = user?.player?.id;

    // Fetch ALL active tournaments (any PES type)
    const { data: tournaments, isLoading } = useQuery({
        queryKey: ["active-tournaments"],
        queryFn: async () => {
            const res = await fetch("/api/tournaments?type=BRACKET_1V1,LEAGUE,GROUP_KNOCKOUT&status=ACTIVE");
            if (!res.ok) return [];
            const json = await res.json();
            return json.data ?? [];
        },
    });

    // Auto-select first tab
    const activeTournaments = tournaments ?? [];
    const currentId = activeTab || activeTournaments[0]?.id || "";
    const currentTournament = activeTournaments.find((t: any) => t.id === currentId);

    // Loading
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-foreground/50">Loading matches...</p>
            </div>
        );
    }

    // No active tournaments
    if (activeTournaments.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
                <div className="p-4 rounded-2xl bg-foreground/5">
                    <Swords className="h-12 w-12 text-foreground/20" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">No Active Matches</h2>
                    <p className="text-sm text-foreground/50 mt-1">
                        Check the Vote page for upcoming tournaments
                    </p>
                </div>
            </div>
        );
    }

    const formatIcon = (type: string) =>
        type === "LEAGUE" ? "🏟️" :
            type === "GROUP_KNOCKOUT" ? "🌍" : "⚔️";

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Tournament tabs (only show if multiple) */}
            {activeTournaments.length > 1 && (
                <Tabs
                    selectedKey={currentId}
                    onSelectionChange={(key) => {
                        setActiveTab(key as string);
                        setSelectedMatch(null);
                        setViewingMatch(null);
                    }}
                    color="primary"
                    variant="solid"
                    classNames={{
                        tabList: "bg-foreground/5 w-full",
                        tab: "font-semibold",
                    }}
                    fullWidth
                >
                    {activeTournaments.map((t: any) => (
                        <Tab
                            key={t.id}
                            title={
                                <span className="flex items-center gap-1.5">
                                    <span>{formatIcon(t.type)}</span>
                                    <span className="truncate max-w-[120px]">{t.name}</span>
                                </span>
                            }
                        />
                    ))}
                </Tabs>
            )}

            {/* Selected tournament content */}
            {currentTournament && (
                <TournamentContent
                    tournament={currentTournament}
                    playerId={playerId}
                    isAdmin={isAdmin}
                    selectedMatch={selectedMatch}
                    viewingMatch={viewingMatch}
                    onSelectMatch={setSelectedMatch}
                    onViewMatch={setViewingMatch}
                />
            )}
        </div>
    );
}

/* ─── Single Tournament Content ─────────────────────────────── */

function TournamentContent({
    tournament,
    playerId,
    isAdmin,
    selectedMatch,
    viewingMatch,
    onSelectMatch,
    onViewMatch,
}: {
    tournament: any;
    playerId?: string;
    isAdmin?: boolean;
    selectedMatch: string | null;
    viewingMatch: string | null;
    onSelectMatch: (id: string | null) => void;
    onViewMatch: (id: string | null) => void;
}) {
    const tournamentId = tournament.id;
    const tournamentType = tournament.type ?? "BRACKET_1V1";

    // Fetch bracket/match data
    const { data: bracketData, isLoading } = useQuery({
        queryKey: ["bracket", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/tournaments/${tournamentId}/bracket`);
            if (!res.ok) return null;
            const json = await res.json();
            return json.data;
        },
        enabled: !!tournamentId,
    });

    const confirmResult = useConfirmResult(tournamentId);
    const disputeResult = useDisputeResult(tournamentId);

    // View result modal data
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

    const formatLabel =
        tournamentType === "LEAGUE" ? "League" :
            tournamentType === "GROUP_KNOCKOUT" ? "Group + Knockout" :
                "Knockout";

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-foreground/50">Loading...</p>
            </div>
        );
    }

    // No matches generated yet
    if (!bracketData?.rounds || bracketData.rounds.length === 0) {
        return (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-divider">
                <Swords className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold">{tournament.name}</p>
                    <p className="text-xs text-foreground/50">Matches not generated yet</p>
                </div>
                <Chip size="sm" color="warning" variant="dot">Waiting</Chip>
            </div>
        );
    }

    return (
        <>
            {/* Tournament Info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-divider">
                <Swords className="h-5 w-5 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold">{tournament.name}</p>
                    <p className="text-xs text-foreground/50">
                        {bracketData.totalPlayers} Players • {formatLabel}
                    </p>
                </div>
                <Chip size="sm" color="success" variant="dot">In Progress</Chip>
            </div>

            {/* My Current Match */}
            {playerId && (
                <MyBracketMatch
                    rounds={bracketData.rounds}
                    currentPlayerId={playerId}
                    onSubmitResult={(id) => onSelectMatch(id)}
                    onConfirmResult={(id) => confirmResult.mutate(id)}
                    onDispute={(id) => disputeResult.mutate(id)}
                />
            )}

            {/* Matches */}
            <div>
                <h2 className="text-lg font-bold mb-4">
                    {tournamentType === "LEAGUE" ? "All Matches" :
                        tournamentType === "GROUP_KNOCKOUT" ? "Tournament Matches" :
                            "Tournament Bracket"}
                </h2>
                <BracketView
                    rounds={bracketData.rounds}
                    totalRounds={bracketData.totalRounds}
                    currentPlayerId={playerId}
                    onSubmitResult={(id) => onSelectMatch(id)}
                    onConfirmResult={(id) => confirmResult.mutate(id)}
                    onDispute={(id) => disputeResult.mutate(id)}
                    onViewResult={(id) => onViewMatch(id)}
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
                    onClose={() => onSelectMatch(null)}
                />
            )}

            {/* View Result Modal */}
            <ViewResultModal
                isOpen={!!viewingMatch}
                onClose={() => onViewMatch(null)}
                match={viewMatchData}
                isAdmin={isAdmin}
                tournamentId={tournamentId}
            />
        </>
    );
}
