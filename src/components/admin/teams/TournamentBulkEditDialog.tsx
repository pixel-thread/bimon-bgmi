"use client";

import { Button } from "@/src/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Loader2, ArrowLeftRight } from "lucide-react";
import { useTournamentStore } from "@/src/store/tournament";
import { useSeasonStore } from "@/src/store/season";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { LoaderFive } from "../../ui/loader";
import { getDisplayName } from "@/src/utils/displayName";
import { MatchT } from "@/src/types/match";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type EditableTeamStats = {
    teamId: string;
    name: string;
    position: string | number;
    players: {
        playerId: string;
        name: string;
        displayName: string | null;
        kills: string | number;
        isAbsent: boolean;
    }[];
};

type MatchData = {
    matchId: string;
    matchNumber: number;
    teams: EditableTeamStats[];
    topTeamsLabel: string; // For identifying which AI group this is
};

type AIMatchGroup = {
    identifier: string;
    topTeams: string;
    players: Array<{ name: string; kills: number | null; position?: number | null; isUnknown?: boolean }>;
};

export function TournamentBulkEditDialog({ open, onOpenChange }: Props) {
    const { tournamentId } = useTournamentStore();
    const { seasonId } = useSeasonStore();
    const queryClient = useQueryClient();

    const [matchDataList, setMatchDataList] = useState<MatchData[]>([]);
    const [initialMatchDataList, setInitialMatchDataList] = useState<MatchData[]>([]);
    const [hasInitialized, setHasInitialized] = useState(false);
    const [unknownPlayers, setUnknownPlayers] = useState<Array<{ name: string; kills: number; matchIdx: number }>>([]);
    const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(new Set()); // For match selection
    const [showMatchSelector, setShowMatchSelector] = useState(true); // Start with match selector view

    // Fetch all matches for this tournament
    const { data: matches, isFetching: isMatchesFetching } = useQuery({
        queryKey: ["match", seasonId, tournamentId],
        queryFn: async () => {
            const url = ADMIN_TOURNAMENT_ENDPOINTS.GET_TOURNAMENT_MATCHES.replace(":id", tournamentId);
            return await http.get<MatchT[]>(url);
        },
        enabled: !!tournamentId && !!seasonId && open,
        select: (data) => data.data,
        refetchOnWindowFocus: false,
    });

    // Fetch teams for selected matches (only after user clicks Proceed)
    const selectedMatchesArr = matches?.filter(m => selectedMatchIds.has(m.id)) || [];
    const { data: allTeamsData, isFetching: isTeamsFetching } = useQuery({
        queryKey: ["teams-selected-matches", tournamentId, Array.from(selectedMatchIds).join(",")],
        queryFn: async () => {
            if (selectedMatchesArr.length === 0) return [];

            // Fetch teams for each selected match
            const teamsPromises = selectedMatchesArr.map(async (match, idx) => {
                const url = ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID
                    .replace(":id", tournamentId)
                    .replace(":matchId", match.id)
                    .replace(":page", "all");
                const response = await http.get<TeamT[]>(url);

                // Extract teams - http.get already unwraps to ApiResponse where .data is the teams array
                let teams: TeamT[] = [];
                const data = response.data as any;

                if (Array.isArray(data)) {
                    teams = data;
                } else if (data?.data && Array.isArray(data.data)) {
                    teams = data.data;
                } else if (data?.teams && Array.isArray(data.teams)) {
                    teams = data.teams;
                }

                return {
                    matchId: match.id,
                    matchNumber: idx + 1, // Use 1-based index for display
                    teams,
                };
            });

            return Promise.all(teamsPromises);
        },
        // Only fetch after user clicks Proceed (showMatchSelector becomes false)
        enabled: !showMatchSelector && selectedMatchIds.size > 0 && open,
        refetchOnWindowFocus: false,
    });

    const isFetching = isMatchesFetching || isTeamsFetching;

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setHasInitialized(false);
            setUnknownPlayers([]);
            setInitialMatchDataList([]);
            setMatchDataList([]);
            setSelectedMatchIds(new Set());
            setShowMatchSelector(true);
        }
    }, [open]);



    // Initialize editable stats from fetched data
    useEffect(() => {
        if (allTeamsData && allTeamsData.length > 0 && !hasInitialized) {
            const initialData: MatchData[] = allTeamsData.map((matchTeams) => {
                const editableTeams = (matchTeams.teams || []).map((team: TeamT, idx: number) => {
                    // Use the team name from API directly - it's already constructed from player display names
                    return {
                        teamId: team.id,
                        name: team.name || `Team ${idx + 1}`,
                        position: team.position === 0 ? "" : team.position,
                        players: (team.players || []).map((player, pIdx) => {
                            const playerStats = team.teamPlayerStats?.find(
                                (ps) => ps.playerId === player.id
                            );
                            // Use fallback player name if not present
                            const playerName = player.name || `Player ${pIdx + 1}`;

                            return {
                                playerId: player.id,
                                name: playerName,
                                displayName: player.displayName ?? null,
                                kills: playerStats?.kills === 0 ? "" : (playerStats?.kills ?? ""),
                                isAbsent: false,
                            };
                        }),
                    };
                });

                return {
                    matchId: matchTeams.matchId,
                    matchNumber: matchTeams.matchNumber,
                    teams: editableTeams,
                    topTeamsLabel: "",
                };
            });

            // Sort by match number
            initialData.sort((a, b) => a.matchNumber - b.matchNumber);
            console.log("Final initialData:", initialData);
            setMatchDataList(initialData);
            setInitialMatchDataList(JSON.parse(JSON.stringify(initialData))); // Deep copy for comparison
            setHasInitialized(true);
        }
    }, [allTeamsData, hasInitialized]);

    // Handle position change
    const handlePositionChange = (matchIdx: number, teamIdx: number, value: string) => {
        const newData = [...matchDataList];
        newData[matchIdx].teams[teamIdx].position = value;
        setMatchDataList(newData);
    };

    // Handle kills change
    const handleKillsChange = (matchIdx: number, teamIdx: number, playerIdx: number, value: string) => {
        const newData = [...matchDataList];
        newData[matchIdx].teams[teamIdx].players[playerIdx].kills = value;
        setMatchDataList(newData);
    };

    // Toggle player absent
    const handleToggleAbsent = (matchIdx: number, teamIdx: number, playerIdx: number) => {
        const newData = [...matchDataList];
        const player = newData[matchIdx].teams[teamIdx].players[playerIdx];
        player.isAbsent = !player.isAbsent;
        if (player.isAbsent) {
            player.kills = "";
        }
        setMatchDataList(newData);
    };

    // Swap match assignments
    const handleSwapMatches = () => {
        if (matchDataList.length < 2) return;

        const newData = [...matchDataList];
        // Swap the teams data between match 0 and match 1
        const tempTeams = newData[0].teams;
        const tempLabel = newData[0].topTeamsLabel;
        newData[0].teams = newData[1].teams;
        newData[0].topTeamsLabel = newData[1].topTeamsLabel;
        newData[1].teams = tempTeams;
        newData[1].topTeamsLabel = tempLabel;

        setMatchDataList(newData);
        toast.success("Match data swapped!");
    };

    // Normalize name for matching
    const normalizeName = useCallback((name: string) =>
        name.normalize('NFKC')
            .toLowerCase()
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g, ' ')
            .trim(), []);

    // Process multi-match JSON
    const processJsonText = useCallback((text: string) => {
        if (!matchDataList || matchDataList.length === 0) return;

        if (!text.trim()) {
            toast.error("No JSON data. Copy JSON from AI first, then paste here.");
            return;
        }

        try {
            const data = JSON.parse(text);

            // Support both formats: { matches: [...] } or direct array of match groups
            const matchGroups: AIMatchGroup[] = data.matches || data;

            if (!Array.isArray(matchGroups) || matchGroups.length === 0) {
                throw new Error("Invalid JSON. Expected matches array.");
            }

            if (matchGroups.length !== matchDataList.length) {
                toast.warning(`Found ${matchGroups.length} match groups, but expected ${matchDataList.length}. Proceeding with available data.`);
            }

            const newUnknownPlayers: Array<{ name: string; kills: number; matchIdx: number }> = [];

            // Build a map of all registered player names per match
            const matchPlayerMaps = matchDataList.map((matchData) => {
                const nameMap = new Map<string, { teamIdx: number; playerIdx: number }>();
                matchData.teams.forEach((team, teamIdx) => {
                    team.players.forEach((player, playerIdx) => {
                        nameMap.set(normalizeName(player.name), { teamIdx, playerIdx });
                        if (player.displayName) {
                            nameMap.set(normalizeName(player.displayName), { teamIdx, playerIdx });
                        }
                    });
                });
                return nameMap;
            });

            // Apply each AI match group to corresponding match
            const newMatchDataList = matchDataList.map((matchData, matchIdx) => {
                const aiGroup = matchGroups[matchIdx];
                if (!aiGroup) return matchData;

                const playerMap = matchPlayerMaps[matchIdx];
                const teamPositions = new Map<string, number>();

                // Reset all players to absent first, then mark present ones
                const newTeams = matchData.teams.map(team => ({
                    ...team,
                    position: "" as string | number,
                    players: team.players.map(p => ({
                        ...p,
                        kills: "" as string | number,
                        isAbsent: true, // Start as absent
                    })),
                }));

                // Process each player from AI
                aiGroup.players.forEach((aiPlayer) => {
                    if (aiPlayer.isUnknown || aiPlayer.kills === null) {
                        if (aiPlayer.isUnknown && aiPlayer.kills !== null) {
                            newUnknownPlayers.push({
                                name: aiPlayer.name,
                                kills: aiPlayer.kills,
                                matchIdx,
                            });
                        }
                        return;
                    }

                    const normalizedName = normalizeName(aiPlayer.name);
                    const location = playerMap.get(normalizedName);

                    if (location) {
                        const { teamIdx, playerIdx } = location;
                        newTeams[teamIdx].players[playerIdx].kills = String(aiPlayer.kills);
                        newTeams[teamIdx].players[playerIdx].isAbsent = false;

                        // Track position
                        if (aiPlayer.position && !teamPositions.has(newTeams[teamIdx].teamId)) {
                            teamPositions.set(newTeams[teamIdx].teamId, aiPlayer.position);
                        }
                    }
                });

                // Apply positions
                newTeams.forEach(team => {
                    const pos = teamPositions.get(team.teamId);
                    if (pos) team.position = String(pos);
                });

                return {
                    ...matchData,
                    teams: newTeams,
                    topTeamsLabel: aiGroup.topTeams || aiGroup.identifier || `Match ${matchIdx + 1}`,
                };
            });

            setMatchDataList(newMatchDataList);
            setUnknownPlayers(newUnknownPlayers);
            toast.success(`Applied data for ${Math.min(matchGroups.length, matchDataList.length)} matches!`);
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(err.message || "Failed to parse JSON");
        }
    }, [matchDataList, normalizeName]);

    // Handle paste
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const text = e.clipboardData.getData("text");
        processJsonText(text);
        e.currentTarget.value = "";
    }, [processJsonText]);

    // Copy AI prompt
    const copyPrompt = useCallback(() => {
        if (!matchDataList || matchDataList.length === 0) return;

        // Collect all unique players across all matches
        const allPlayers = new Map<string, string>();
        const allTeams = new Map<string, string[]>();

        matchDataList.forEach((matchData) => {
            matchData.teams.forEach((team) => {
                const teamPlayers: string[] = [];
                team.players.forEach((p) => {
                    const displayName = p.displayName || p.name;
                    const key = p.name.toLowerCase();
                    if (!allPlayers.has(key)) {
                        allPlayers.set(key, displayName !== p.name ? `${displayName} (userName: ${p.name})` : p.name);
                    }
                    teamPlayers.push(displayName);
                });
                if (!allTeams.has(team.name)) {
                    allTeams.set(team.name, teamPlayers);
                }
            });
        });

        const totalPlayers = allPlayers.size;
        const totalTeams = allTeams.size;
        const numMatches = matchDataList.length;

        const prompt = `Extract player stats from ${numMatches} BGMI match scoreboards.

IMPORTANT: The images are from ${numMatches} DIFFERENT MATCHES. Group images by their TOP 3 TEAMS (+ their kills) on the LEFT side of each image. Images with identical Position 1, 2, 3 teams AND kills = same match.

Player names to match (USE THESE EXACT NAMES in output):
${Array.from(allPlayers.values()).join(", ")}

Total: ${totalTeams} teams, ${totalPlayers} players, ${numMatches} matches

Teams and their players:
${Array.from(allTeams.entries()).map(([name, players]) => `- ${name}: ${players.join(", ")}`).join("\n")}

OUTPUT FORMAT:
{
  "matches": [
    {
      "identifier": "A",
      "topTeams": "Position1Team (X total kills), Position2Team (Y kills), Position3Team (Z kills)",
      "players": [
        {"name": "player_from_my_list", "kills": 5, "position": 1},
        {"name": "absent_player", "kills": null, "position": null},
        {"name": "unknown_player", "kills": 3, "position": 2, "isUnknown": true}
      ]
    },
    {
      "identifier": "B",
      "topTeams": "...",
      "players": [...]
    }
  ]
}

RULES:
- Group images by identical top-3 teams + their kills (same match will have same top-3 in every image)
- Include ALL ${totalPlayers} registered players in EACH match group
- For players NOT found in that match's scoreboard: set kills to null
- Use EXACT names from MY list above
- The "topTeams" field helps identify which match is which - include team names and total kills
- Position = rank number shown next to each team (1, 2, 3, etc.)

After JSON, show:
Match A: Position 1-3 teams, total players found
Match B: Position 1-3 teams, total players found
⚠️ Any uncertain matches or high kill counts`;

        navigator.clipboard.writeText(prompt);
        toast.success("Prompt copied to clipboard!");
    }, [matchDataList]);

    // Save mutation - uses longer timeout for bulk operations (64 players x 2 matches)
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            // Save each match's stats sequentially to avoid overwhelming the server
            const results = [];
            for (const matchData of matchDataList) {
                const payload = {
                    stats: matchData.teams.map((stat) => ({
                        teamId: stat.teamId,
                        position: stat.position === "" ? 0 : Number(stat.position),
                        players: stat.players
                            .filter((p) => !p.isAbsent)
                            .map((p) => ({
                                playerId: p.playerId,
                                kills: p.kills === "" ? 0 : Number(p.kills),
                                deaths: 1,
                            })),
                    })),
                };

                const url = `/api/admin/match/${matchData.matchId}/bulk-stats`;
                // 30 second timeout per match (optimized for free Vercel tier)
                const result = await http.put(url, payload, { timeout: 30000 });
                results.push(result);
            }
            return results;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            toast.success("All matches saved successfully!");
            onOpenChange(false);
        },
        onError: (error: Error & { message?: string; response?: { data?: { message?: string } } }) => {
            const errorMsg = error.response?.data?.message || error.message || "Failed to save stats";
            if (errorMsg.toLowerCase().includes("timeout")) {
                toast.error("Save timed out - too many players. Try saving fewer matches at once.");
            } else {
                toast.error(errorMsg);
            }
        },
    });

    const handleSave = () => {
        mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-6xl max-h-[90vh] h-[90vh] flex flex-col overflow-hidden p-0 gap-0 [&>button]:hidden">
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5">
                    <DialogHeader className="p-3 sm:p-4 bg-background">
                        <DialogTitle className="text-lg font-semibold">
                            {showMatchSelector
                                ? `Select Matches to Edit (${matches?.length || 0} available)`
                                : `Bulk Edit Matches (${selectedMatchIds.size} selected)`
                            }
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {showMatchSelector
                                ? "Choose which matches you want to edit, then click Proceed."
                                : "Edit stats for selected matches. Paste AI JSON to auto-fill."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {/* MATCH SELECTOR VIEW */}
                    {showMatchSelector && (
                        <div className="px-3 sm:px-4 pb-4">
                            {isMatchesFetching ? (
                                <div className="flex flex-col items-center justify-center p-8">
                                    <LoaderFive text="Loading matches..." />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-2 mb-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                if (matches) {
                                                    setSelectedMatchIds(new Set(matches.map(m => m.id)));
                                                }
                                            }}
                                        >
                                            Select All
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedMatchIds(new Set())}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {matches?.map((match, idx) => (
                                            <div
                                                key={match.id}
                                                onClick={() => {
                                                    const newSet = new Set(selectedMatchIds);
                                                    if (newSet.has(match.id)) {
                                                        newSet.delete(match.id);
                                                    } else {
                                                        newSet.add(match.id);
                                                    }
                                                    setSelectedMatchIds(newSet);
                                                }}
                                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedMatchIds.has(match.id)
                                                    ? "bg-primary/20 border-primary"
                                                    : "bg-muted/30 border-border hover:bg-muted/50"
                                                    }`}
                                            >
                                                <div className="font-semibold text-center">Match {idx + 1}</div>
                                                <div className="text-xs text-muted-foreground text-center">
                                                    ID: {match.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* EDIT VIEW */}
                    {!showMatchSelector && (
                        <>
                            {/* AI BUTTONS */}
                            <div className="flex gap-2 mb-3 px-3 sm:px-4">
                                <Button variant="outline" size="sm" onClick={copyPrompt} className="gap-2">
                                    📋 Copy Prompt
                                </Button>
                                <textarea
                                    onPaste={handlePaste}
                                    placeholder="Click & Ctrl+V"
                                    className="hidden sm:block flex-1 h-9 px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            const text = await navigator.clipboard.readText();
                                            processJsonText(text);
                                        } catch {
                                            toast.error("Click the input and use Ctrl+V");
                                        }
                                    }}
                                    className="gap-2"
                                >
                                    📥 Paste
                                </Button>
                                {matchDataList.length >= 2 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSwapMatches}
                                        className="gap-2"
                                        title="Swap match data assignments"
                                    >
                                        <ArrowLeftRight className="h-4 w-4" />
                                        Swap
                                    </Button>
                                )}
                            </div>

                            {isFetching ? (
                                <div className="h-full flex flex-col items-center justify-center p-8">
                                    <LoaderFive text="Loading matches..." />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-3 sm:px-4 pb-4">
                                    {matchDataList.map((matchData, matchIdx) => (
                                        <div key={matchData.matchId} className="border rounded-lg p-3 bg-background">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-base">
                                                    Match {matchIdx + 1}
                                                </h3>
                                                {matchData.topTeamsLabel && (
                                                    <span className="text-xs text-muted-foreground max-w-[60%] truncate">
                                                        {matchData.topTeamsLabel}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                                {matchData.teams.map((team, teamIdx) => {
                                                    const hasData = team.position !== "" || team.players.some(p => p.kills !== "");
                                                    return (
                                                        <div
                                                            key={team.teamId}
                                                            className={`rounded-lg border p-3 ${hasData ? "bg-emerald-500/20" : "bg-muted/30"}`}
                                                        >
                                                            {/* Team Name Header */}
                                                            <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                                                <div
                                                                    className="flex-1 min-w-0 overflow-x-auto scrollbar-hide"
                                                                    title={team.name}
                                                                >
                                                                    <span className="font-medium text-sm whitespace-nowrap">{team.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <span className="text-xs text-muted-foreground">#</span>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max="20"
                                                                        value={team.position}
                                                                        onChange={(e) => handlePositionChange(matchIdx, teamIdx, e.target.value)}
                                                                        className="w-12 h-7 text-center text-sm"
                                                                        placeholder="#"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {/* Players Grid */}
                                                            <div className="grid grid-cols-3 gap-1">
                                                                {team.players.map((player, playerIdx) => (
                                                                    <div
                                                                        key={player.playerId}
                                                                        onClick={() => handleToggleAbsent(matchIdx, teamIdx, playerIdx)}
                                                                        className={`flex items-center gap-1 bg-muted/50 rounded px-1.5 py-0.5 cursor-pointer hover:bg-muted/70 ${player.isAbsent ? "ring-1 ring-red-500/50" : ""}`}
                                                                        title={`Click to ${player.isAbsent ? "mark present" : "mark absent"}`}
                                                                    >
                                                                        <span className={`text-[10px] truncate flex-1 ${player.isAbsent ? "text-red-500" : ""}`}>
                                                                            {player.displayName || player.name}
                                                                        </span>
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            value={player.kills}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onChange={(e) => handleKillsChange(matchIdx, teamIdx, playerIdx, e.target.value)}
                                                                            className="w-8 h-5 text-center text-[10px]"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Unknown players warning */}
                            {unknownPlayers.length > 0 && (
                                <div className="mx-3 sm:mx-4 mb-4 p-3 rounded-md bg-orange-500/10 border border-orange-500/30">
                                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                        🆕 Unknown Players ({unknownPlayers.length})
                                    </p>
                                    <p className="text-xs text-orange-600/80 dark:text-orange-400/80">
                                        {unknownPlayers.slice(0, 5).map(p => `${p.name} (Match ${matchDataList[p.matchIdx]?.matchNumber || p.matchIdx + 1})`).join(", ")}
                                        {unknownPlayers.length > 5 && ` +${unknownPlayers.length - 5} more`}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="p-3 sm:p-4 border-t bg-background flex-shrink-0">
                    <div className="flex w-full gap-3 sm:justify-end">
                        {showMatchSelector ? (
                            <>
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setShowMatchSelector(false)}
                                    disabled={selectedMatchIds.size === 0}
                                    className="font-semibold"
                                >
                                    Proceed ({selectedMatchIds.size} selected)
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setShowMatchSelector(true)}>
                                    ← Back
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isPending || JSON.stringify(matchDataList) === JSON.stringify(initialMatchDataList)}
                                    className="font-semibold"
                                    title={JSON.stringify(matchDataList) === JSON.stringify(initialMatchDataList) ? "No changes to save" : ""}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        `Save All (${matchDataList.length} matches)`
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
