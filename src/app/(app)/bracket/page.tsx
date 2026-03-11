"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BracketView, MyBracketMatch } from "@/components/bracket/bracket-view";
import { GroupKnockoutView } from "@/components/bracket/group-knockout-view";
import { SubmitResultModal } from "@/components/bracket/submit-result-modal";
import { ViewResultModal } from "@/components/bracket/view-result-modal";
import { useConfirmResult, useDisputeResult } from "@/components/bracket/submit-result-modal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { Trophy, Swords, Clock } from "lucide-react";
import { Chip, Tabs, Tab, Skeleton } from "@heroui/react";

// Fallback famous footballers (if gallery is empty)
const FAMOUS_PLAYERS = [
    "Messi", "Cristiano Ronaldo", "Neymar", "Mbappe", "Haaland",
    "Ronaldinho", "Zidane", "Beckham", "Maradona", "Pele",
    "Modric", "De Bruyne", "Salah", "Lewandowski", "Benzema", "Kaka",
];

/**
 * /bracket — Matches page.
 * Shows all active tournaments with tabs to switch between them.
 */
type SelectedMatch = {
    id: string;
    player1Id: string | null;
    player1Name: string | null;
    player1Avatar: string | null;
    player2Name: string | null;
    player2Avatar: string | null;
    isDisputing?: boolean;
} | null;

export default function MatchesPage() {
    const { user, isAdmin } = useAuthUser();
    const [selectedMatch, setSelectedMatch] = useState<SelectedMatch>(null);
    const [viewingMatch, setViewingMatch] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("");
    const playerId = user?.player?.id;

    // Fetch bracket background: existing gallery images, TheSportsDB fallback
    const [bgSeed] = useState(() => Math.random());
    const bgQuery = useQuery({
        queryKey: ["bracket-bg", bgSeed],
        queryFn: async () => {
            // Try existing gallery (non-character images)
            try {
                const res = await fetch("/api/gallery");
                if (res.ok) {
                    const json = await res.json();
                    const items = (json.data ?? []).filter((g: any) => !g.isCharacterImg);
                    if (items.length > 0) {
                        const pick = items[Math.floor(Math.random() * items.length)];
                        return { name: pick.name, img: pick.publicUrl };
                    }
                }
            } catch { /* fall through */ }

            // Fallback: TheSportsDB
            const name = FAMOUS_PLAYERS[Math.floor(Math.random() * FAMOUS_PLAYERS.length)];
            const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`);
            const data = await res.json();
            const player = data?.player?.find((p: any) => p.strCutout && p.strSport === "Soccer");
            if (player) return { name: player.strPlayer, img: player.strCutout };
            return null;
        },
        staleTime: 0,
        retry: false,
    });

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
    // Only show tournaments that have bracket matches generated (not still voting)
    const activeTournaments = (tournaments ?? []).filter((t: any) => t.bracketMatchCount > 0);
    const currentId = activeTab || activeTournaments[0]?.id || "";
    const currentTournament = activeTournaments.find((t: any) => t.id === currentId);

    // Loading
    if (isLoading) {
        return <FootballLoader />;
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
        <div className="relative min-h-[80vh]">
            {/* Background image from gallery or TheSportsDB */}
            {bgQuery.data?.img && (
                <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={bgQuery.data.img}
                        alt=""
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[90vh] w-auto object-contain opacity-[0.25]"
                        style={{ filter: "grayscale(100%)" }}
                    />
                    {/* Radial vignette — fades edges so content stays readable */}
                    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 20%, var(--background) 75%)" }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
                    <span className="absolute bottom-4 right-4 text-[9px] text-foreground/10 font-medium tracking-wider uppercase">
                        {bgQuery.data.name}
                    </span>
                </div>
            )}

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
                            tabList: "bg-foreground/5 w-full overflow-x-auto flex-nowrap",
                            tab: "font-semibold whitespace-nowrap",
                        }}
                        fullWidth
                    >
                        {activeTournaments.map((t: any) => (
                            <Tab
                                key={t.id}
                                title={
                                    <span className="flex items-center gap-1.5">
                                        <span>{formatIcon(t.type)}</span>
                                        <span>{t.name}</span>
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
                        showName={activeTournaments.length <= 1}
                        selectedMatch={selectedMatch}
                        viewingMatch={viewingMatch}
                        onSelectMatch={setSelectedMatch}
                        onViewMatch={setViewingMatch}
                    />
                )}
            </div>
        </div>
    );
}

/* ─── Single Tournament Content ─────────────────────────────── */

function TournamentContent({
    tournament,
    playerId,
    isAdmin,
    showName = true,
    selectedMatch,
    viewingMatch,
    onSelectMatch,
    onViewMatch,
}: {
    tournament: any;
    playerId?: string;
    isAdmin?: boolean;
    showName?: boolean;
    selectedMatch: SelectedMatch;
    viewingMatch: string | null;
    onSelectMatch: (m: SelectedMatch) => void;
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

    const allMatches = bracketData?.rounds?.flatMap((r: any) => r.matches) ?? [];

    // Compute stage end times from latest unfinished match + deadline hours
    // NOTE: must be before early returns to comply with Rules of Hooks
    const stageDeadlines = useMemo(() => {
        if (!bracketData?.deadlines || !bracketData?.rounds) return null;
        const matches = bracketData.rounds.flatMap((r: any) => r.matches);
        const now = Date.now();

        const formatDeadline = (date: Date) => {
            const diff = date.getTime() - now;
            if (diff <= 0) return "Ended";
            if (diff < 24 * 60 * 60 * 1000) {
                const hours = Math.floor(diff / (60 * 60 * 1000));
                const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
                return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
            }
            return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
        };

        if (tournamentType === "GROUP_KNOCKOUT") {
            const groupMatches = matches.filter((m: any) => m.round < 0 && m.status !== "CONFIRMED");
            // Only count KO matches that have players assigned (KO stage actually started)
            const koMatches = matches.filter((m: any) => m.round > 0 && m.status !== "CONFIRMED" && m.player1Id && m.player2Id);

            const latestGroup = groupMatches.length > 0
                ? new Date(Math.max(...groupMatches.map((m: any) => new Date(m.createdAt).getTime())) + bracketData.deadlines.groupHours * 3600000)
                : null;
            const latestKO = koMatches.length > 0
                ? new Date(Math.max(...koMatches.map((m: any) => new Date(m.createdAt).getTime())) + bracketData.deadlines.koHours * 3600000)
                : null;

            // Has the KO stage actually started? (any KO match with players)
            const allKoMatches = matches.filter((m: any) => m.round > 0);
            const koStarted = allKoMatches.some((m: any) => m.player1Id && m.player2Id);
            const koAllConfirmed = koStarted && allKoMatches.every((m: any) => m.status === "CONFIRMED" || m.status === "BYE");

            return {
                group: latestGroup ? formatDeadline(latestGroup) : null,
                ko: latestKO ? formatDeadline(latestKO) : null,
                groupDone: groupMatches.length === 0,
                koStarted,
                koDone: koAllConfirmed,
            };
        } else {
            const pendingMatches = matches.filter((m: any) => m.status !== "CONFIRMED");
            const latestEnd = pendingMatches.length > 0
                ? new Date(Math.max(...pendingMatches.map((m: any) => new Date(m.createdAt).getTime())) + bracketData.deadlines.koHours * 3600000)
                : null;

            return {
                overall: latestEnd ? formatDeadline(latestEnd) : null,
                done: pendingMatches.length === 0,
            };
        }
    }, [bracketData, tournamentType]);

    // Helper — build submit context from a match id
    const matchContext = (matchId: string, isDisputing = false): SelectedMatch => {
        const m = allMatches.find((x: any) => x.id === matchId);
        if (!m) return { id: matchId, player1Id: null, player1Name: null, player1Avatar: null, player2Name: null, player2Avatar: null, isDisputing };
        return {
            id: matchId,
            player1Id: m.player1Id ?? null,
            player1Name: m.player1?.displayName ?? null,
            player1Avatar: m.player1Avatar ?? null,
            player2Name: m.player2?.displayName ?? null,
            player2Avatar: m.player2Avatar ?? null,
            isDisputing,
        };
    };

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
            <div className="space-y-5">
                {/* Tournament info skeleton */}
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-xl" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-40 rounded-md" />
                            <Skeleton className="h-3 w-24 rounded-md" />
                        </div>
                        <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                </div>

                {/* Match rows skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-5 w-32 rounded-md" />
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-divider">
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <span className="text-[10px] text-foreground/15 font-bold">VS</span>
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <div className="ml-auto">
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
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
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 space-y-3">
                {/* Glow blob */}
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

                <div className="relative flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/15 text-xl shrink-0">
                        {tournamentType === "LEAGUE" ? "🏟️" : tournamentType === "GROUP_KNOCKOUT" ? "🌍" : "⚔️"}
                    </div>
                    <div className="flex-1 min-w-0">
                        {showName && (
                            <p className="font-bold text-base leading-tight truncate">{tournament.name}</p>
                        )}
                        <div className={`flex items-center gap-2 flex-wrap ${showName ? 'mt-0.5' : ''}`}>
                            <span className="text-[11px] text-foreground/40 font-medium">
                                {bracketData.totalPlayers} players
                            </span>
                            <span className="h-1 w-1 rounded-full bg-foreground/20" />
                            <span className="text-[11px] text-foreground/40 font-medium">{formatLabel}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/20 shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        <span className="text-[11px] font-bold text-success">Live</span>
                    </div>
                </div>

                {/* Stage deadlines */}
                {stageDeadlines && (
                    <div className="relative flex items-center gap-2 flex-wrap">
                        <Clock className="h-3.5 w-3.5 text-warning shrink-0" />
                        {tournamentType === "GROUP_KNOCKOUT" ? (
                            <>
                                <span className={`text-[11px] font-medium ${stageDeadlines.groupDone ? 'text-success' : 'text-warning'}`}>
                                    Group: {stageDeadlines.groupDone ? "✓ Done" : stageDeadlines.group}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-foreground/20" />
                                <span className={`text-[11px] font-medium ${stageDeadlines.koDone ? 'text-success' : stageDeadlines.koStarted ? 'text-warning' : stageDeadlines.groupDone ? 'text-primary' : 'text-foreground/30'}`}>
                                    KO: {stageDeadlines.koDone ? "✓ Done" : stageDeadlines.koStarted ? (stageDeadlines.ko ?? "In progress") : stageDeadlines.groupDone ? "⏳ Starting soon" : "Not started"}
                                </span>
                            </>
                        ) : (
                            <span className={`text-[11px] font-medium ${stageDeadlines.done ? 'text-success' : 'text-warning'}`}>
                                {stageDeadlines.done ? "✓ All matches complete" : `Ends: ${stageDeadlines.overall}`}
                            </span>
                        )}
                    </div>
                )}
            </div>


            {/* My Current Match */}
            {playerId && (
                <MyBracketMatch
                    rounds={bracketData.rounds}
                    currentPlayerId={playerId}
                    onSubmitResult={(id) => onSelectMatch(matchContext(id))}
                    onConfirmResult={(id) => confirmResult.mutate(id)}
                    onDispute={(id) => onSelectMatch(matchContext(id, true))}
                    deadlines={bracketData.deadlines}
                    tournamentType={tournamentType}
                />
            )}

            {/* Matches */}
            <div>
                <h2 className="text-lg font-bold mb-4">
                    {tournamentType === "LEAGUE" ? "All Matches" :
                        tournamentType === "GROUP_KNOCKOUT" ? "Tournament" :
                            "Tournament Bracket"}
                </h2>
                {tournamentType === "GROUP_KNOCKOUT" ? (
                    <GroupKnockoutView
                        rounds={bracketData.rounds}
                        totalRounds={bracketData.totalRounds}
                        currentPlayerId={playerId}
                        isAdmin={isAdmin}
                        onSubmitResult={(id) => onSelectMatch(matchContext(id))}
                        onConfirmResult={(id) => confirmResult.mutate(id)}
                        onDispute={(id) => onSelectMatch(matchContext(id, true))}
                        onViewResult={(id) => onViewMatch(id)}
                    />
                ) : (
                    <BracketView
                        rounds={bracketData.rounds}
                        totalRounds={bracketData.totalRounds}
                        currentPlayerId={playerId}
                        isAdmin={isAdmin}
                        onSubmitResult={(id) => onSelectMatch(matchContext(id))}
                        onConfirmResult={(id) => confirmResult.mutate(id)}
                        onDispute={(id) => onSelectMatch(matchContext(id, true))}
                        onViewResult={(id) => onViewMatch(id)}
                    />
                )}
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
                    matchId={selectedMatch.id}
                    tournamentId={tournamentId}
                    isOpen={!!selectedMatch}
                    onClose={() => onSelectMatch(null)}
                    player1Id={selectedMatch.player1Id}
                    player1Name={selectedMatch.player1Name}
                    player1Avatar={selectedMatch.player1Avatar}
                    player2Name={selectedMatch.player2Name}
                    player2Avatar={selectedMatch.player2Avatar}
                    currentPlayerId={playerId}
                    isAdmin={isAdmin}
                    isDisputing={selectedMatch.isDisputing}
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

/* ─── Bouncing Football Loader ────────────────────────────── */
function FootballLoader() {
    return (
        <div className="flex items-center justify-center py-32">
            <div className="relative h-16">
                {/* Ball */}
                <span
                    className="text-3xl block"
                    style={{ animation: "ballBounce 0.6s ease-in-out infinite alternate" }}
                >
                    ⚽
                </span>
                {/* Shadow */}
                <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-1.5 rounded-full bg-foreground/10 blur-[2px]"
                    style={{ animation: "ballShadow 0.6s ease-in-out infinite alternate" }}
                />
            </div>
            <style>{`
                @keyframes ballBounce {
                    from { transform: translateY(0); }
                    to { transform: translateY(-24px); }
                }
                @keyframes ballShadow {
                    from { opacity: 0.8; transform: translateX(-50%) scaleX(1); }
                    to { opacity: 0.2; transform: translateX(-50%) scaleX(0.5); }
                }
            `}</style>
        </div>
    );
}
