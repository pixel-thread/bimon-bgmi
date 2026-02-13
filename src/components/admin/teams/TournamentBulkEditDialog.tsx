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
    const [matchNumberMap, setMatchNumberMap] = useState<Map<string, number>>(new Map()); // Store matchId -> matchNumber
    const [showMatchSelector, setShowMatchSelector] = useState(true); // Start with match selector view
    const [changeNotes, setChangeNotes] = useState<string[]>([]); // DEV: Track changes from saved data
    const [hasPasted, setHasPasted] = useState(false); // Track if first paste has happened

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
        queryKey: ["teams-selected-matches", tournamentId, Array.from(selectedMatchIds).join(","), matchNumberMap.size],
        queryFn: async () => {
            if (selectedMatchesArr.length === 0) return [];

            // Fetch teams for each selected match
            const teamsPromises = selectedMatchesArr.map(async (match) => {
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
                    matchNumber: matchNumberMap.get(match.id) || 1, // Get match number from map
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
            setHasPasted(false);
            setChangeNotes([]);
        }
    }, [open]);



    // Initialize editable stats from fetched data
    useEffect(() => {
        if (allTeamsData && allTeamsData.length > 0 && !hasInitialized) {
            const initialData: MatchData[] = allTeamsData.map((matchTeams) => {
                // Check if ANY team has stats submitted (meaning scoreboard was saved for this match)
                const matchHasStats = (matchTeams.teams || []).some((team: TeamT) =>
                    team.teamPlayerStats && team.teamPlayerStats.length > 0
                );

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
                            // Player is absent if: match has stats saved but this player doesn't have stats
                            const wasAbsent = matchHasStats && !playerStats;

                            return {
                                playerId: player.id,
                                name: playerName,
                                displayName: player.displayName ?? null,
                                // Preserve 0 kills, only convert null/undefined to empty
                                kills: playerStats?.kills != null ? String(playerStats.kills) : "",
                                isAbsent: wasAbsent,
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
            setMatchDataList(initialData);
            setInitialMatchDataList(JSON.parse(JSON.stringify(initialData))); // Deep copy for comparison
            setHasInitialized(true);
        }
    }, [allTeamsData, hasInitialized]);

    // Compare only the relevant data fields, ignoring display-only fields like topTeamsLabel
    const hasDataChanges = useCallback(() => {
        if (matchDataList.length !== initialMatchDataList.length) return true;

        for (let m = 0; m < matchDataList.length; m++) {
            const current = matchDataList[m];
            const initial = initialMatchDataList[m];

            if (current.teams.length !== initial.teams.length) return true;

            for (let t = 0; t < current.teams.length; t++) {
                const currentTeam = current.teams[t];
                const initialTeam = initial.teams[t];

                // Compare position (normalize to strings for comparison)
                const currentPos = String(currentTeam.position || "");
                const initialPos = String(initialTeam.position || "");
                if (currentPos !== initialPos) return true;

                // Compare players
                if (currentTeam.players.length !== initialTeam.players.length) return true;

                for (let p = 0; p < currentTeam.players.length; p++) {
                    const currentPlayer = currentTeam.players[p];
                    const initialPlayer = initialTeam.players[p];

                    // Compare kills (normalize empty string vs 0)
                    const currentKills = currentPlayer.kills === "" || currentPlayer.kills === null ? "" : String(currentPlayer.kills);
                    const initialKills = initialPlayer.kills === "" || initialPlayer.kills === null ? "" : String(initialPlayer.kills);
                    if (currentKills !== initialKills) return true;

                    // Compare isAbsent
                    if (currentPlayer.isAbsent !== initialPlayer.isAbsent) return true;
                }
            }
        }

        return false;
    }, [matchDataList, initialMatchDataList]);

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

            // DEV: Log changes compared to PREVIOUS paste (not initial saved data)
            // Only show change notes on second or subsequent pastes
            if (hasPasted && matchDataList.length > 0) {
                const changes: string[] = [];
                for (let mIdx = 0; mIdx < newMatchDataList.length && mIdx < matchDataList.length; mIdx++) {
                    const newMatch = newMatchDataList[mIdx];
                    const oldMatch = matchDataList[mIdx]; // Compare to CURRENT data (previous paste)
                    if (!oldMatch) continue;

                    const matchChanges: string[] = [];
                    for (let tIdx = 0; tIdx < newMatch.teams.length && tIdx < oldMatch.teams.length; tIdx++) {
                        const newTeam = newMatch.teams[tIdx];
                        const oldTeam = oldMatch.teams[tIdx];
                        if (!oldTeam) continue;

                        // Position change - normalize to strings for comparison
                        const oldPos = String(oldTeam.position || "");
                        const newPos = String(newTeam.position || "");
                        if (oldPos !== newPos) {
                            matchChanges.push(`📍 ${newTeam.name}: Position ${oldPos || "?"} → ${newPos || "?"}`);
                        }

                        // Player changes
                        for (let pIdx = 0; pIdx < newTeam.players.length && pIdx < oldTeam.players.length; pIdx++) {
                            const newPlayer = newTeam.players[pIdx];
                            const oldPlayer = oldTeam.players[pIdx];
                            if (!oldPlayer) continue;

                            // Use same normalization as hasDataChanges
                            const oldKills = oldPlayer.kills === "" || oldPlayer.kills === null ? "" : String(oldPlayer.kills);
                            const newKills = newPlayer.kills === "" || newPlayer.kills === null ? "" : String(newPlayer.kills);

                            if (oldKills !== newKills) {
                                matchChanges.push(`  🎯 ${newPlayer.displayName || newPlayer.name}: Kills ${oldKills || "-"} → ${newKills || "-"}`);
                            }

                            if (oldPlayer.isAbsent !== newPlayer.isAbsent) {
                                matchChanges.push(`  👤 ${newPlayer.displayName || newPlayer.name}: ${oldPlayer.isAbsent ? "Absent → Present" : "Present → Absent"}`);
                            }
                        }
                    }

                    if (matchChanges.length > 0) {
                        changes.push(...matchChanges);
                    }
                }

                // Store in state for UI display
                setChangeNotes(changes);
            } else {
                setChangeNotes([]);
            }

            // Mark that first paste has happened
            setHasPasted(true);

            setMatchDataList(newMatchDataList);
            setUnknownPlayers(newUnknownPlayers);
            toast.success(`Applied data for ${Math.min(matchGroups.length, matchDataList.length)} matches!`);
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(err.message || "Failed to parse JSON");
        }
    }, [matchDataList, normalizeName, hasPasted]);

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

REGISTERED PLAYERS (${totalTeams} teams, ${totalPlayers} players):
${Array.from(allTeams.entries()).map(([name, players]) => `• ${name}: ${players.join(", ")}`).join("\n")}

HOW TO GROUP MATCHES:
- Look at LEFT side of scoreboard - shows Position #1 and #2 teams
- Images with SAME #1 and #2 teams (same names + same kills) = SAME MATCH

⚠️⚠️⚠️ CRITICAL - NULL vs 0 (READ CAREFULLY):
- kills: 0 = Player IS in scoreboard with 0 finishes (PRESENT)
- kills: null = Player is NOT in ANY scoreboard image (ABSENT)

CHECK EACH PLAYER:
1. Search ALL images for this player's name
2. Found with "0" finishes? → kills: 0 (they played but got 0 kills)
3. Found with N finishes? → kills: N
4. NOT found in ANY image? → kills: null (they didn't play this match)

❌ WRONG: {"name": "MissingPlayer", "kills": 0} ← Don't use 0 for missing players!
✅ RIGHT: {"name": "MissingPlayer", "kills": null} ← Use null for missing players
✅ RIGHT: {"name": "FoundPlayer", "kills": 0} ← Use 0 only if you SEE them with 0

OUTPUT FORMAT:
{
  "matches": [
    {
      "identifier": "A",
      "topTeams": "#1 Team (Xkills), #2 Team (Ykills)",
      "players": [
        {"name": "player_i_saw", "kills": 5, "position": 1},
        {"name": "player_with_0_finishes", "kills": 0, "position": 3},
        {"name": "player_NOT_in_any_image", "kills": null, "position": null},
        {"name": "unknown_scoreboard_name", "kills": 3, "position": 2, "isUnknown": true}
      ]
    }
  ]
}

🔍🔍🔍 UNKNOWN PLAYERS (VERY IMPORTANT - DO NOT SKIP):
After matching all players from my list, check the scoreboard for ANY remaining players that you could NOT match to anyone in my list above.
These are NEW players whose in-game names are different from the usernames I provided.
- For EACH unmatched scoreboard player, add them to the JSON with "isUnknown": true
- Use their EXACT scoreboard name (since they're not in my list)
- Include them in EACH match where they appear
- Example: if scoreboard shows "xXDarkKnight" but no one in my list matches → add {"name": "xXDarkKnight", "kills": 2, "position": 4, "isUnknown": true}

RULES:
1. Group images by #1 + #2 teams in LEFT panel
2. Include ALL ${totalPlayers} players in EACH match output
3. Use EXACT names from my list
4. kills = finishes number you SEE; null if NOT FOUND
5. position = team's rank (1-13)
6. Add unmatched scoreboard players with "isUnknown": true

BEFORE SUBMITTING: Double-check that absent players have null, not 0!

Confirm: Match A: #1 team, #2 team, X found, Y absent (null), Z unknown`;

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

                const url = `/admin/match/${matchData.matchId}/bulk-stats`;
                // 30 second timeout per match (optimized for free Vercel tier)
                const result = await http.put(url, payload, { timeout: 30000 });

                // Validate the response - http.put returns {success: false} on error instead of throwing
                if (!result.success) {
                    throw new Error(result.message || `Failed to save Match ${matchData.matchNumber}`);
                }

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
                                                    Match {matchData.matchNumber}
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
                                                                    <span className="font-medium text-sm whitespace-nowrap">
                                                                        {team.players.map((player, pIdx) => (
                                                                            <span key={player.playerId}>
                                                                                {pIdx > 0 && "_"}
                                                                                <span
                                                                                    onClick={() => handleToggleAbsent(matchIdx, teamIdx, pIdx)}
                                                                                    className={`cursor-pointer hover:underline ${player.isAbsent ? "text-red-600 dark:text-red-400" : ""}`}
                                                                                    title={`Click to ${player.isAbsent ? "mark present" : "mark absent"}`}
                                                                                >
                                                                                    {player.displayName || player.name}
                                                                                </span>
                                                                            </span>
                                                                        ))}
                                                                    </span>
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

                            {/* DEV: Change notes from saved data */}
                            {changeNotes.length > 0 && (
                                <div className="mx-3 sm:mx-4 mb-4 p-3 rounded-md bg-cyan-500/10 border border-cyan-500/30 max-h-32 overflow-y-auto">
                                    <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-2">
                                        🔄 Changes from saved data ({changeNotes.length})
                                    </p>
                                    <div className="text-xs text-cyan-600/80 dark:text-cyan-400/80 space-y-0.5 font-mono">
                                        {changeNotes.slice(0, 20).map((note, idx) => (
                                            <div key={idx}>{note}</div>
                                        ))}
                                        {changeNotes.length > 20 && (
                                            <div className="text-cyan-500">+{changeNotes.length - 20} more changes...</div>
                                        )}
                                    </div>
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
                                    onClick={() => {
                                        // Build map of matchId -> matchNumber before proceeding
                                        if (matches) {
                                            const numberMap = new Map<string, number>();
                                            matches.forEach((m, idx) => {
                                                if (selectedMatchIds.has(m.id)) {
                                                    numberMap.set(m.id, idx + 1); // 1-based match number
                                                }
                                            });
                                            setMatchNumberMap(numberMap);
                                        }
                                        setShowMatchSelector(false);
                                    }}
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
                                    disabled={isPending || !hasDataChanges()}
                                    className="font-semibold"
                                    title={!hasDataChanges() ? "No changes to save" : ""}
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
