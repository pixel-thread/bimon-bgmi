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
import { useTeams } from "@/src/hooks/team/useTeams";
import { Loader2 } from "lucide-react";
import { ADMIN_MATCH_ENDPOINTS } from "@/src/lib/endpoints/admin/match";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { useTournamentStore } from "@/src/store/tournament";
import { usePendingRefetch } from "@/src/store/match/usePendingRefetch";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { TeamStatsForm } from "@/src/utils/validation/team/team-stats";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { LoaderFive } from "../../ui/loader";
import { getDisplayName } from "@/src/utils/displayName";

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
        isAbsent: boolean; // True if player was NOT found in AI JSON (absent from match)
    }[];
};

export function BulkEditStatsDialog({ open, onOpenChange }: Props) {
    const { matchId, matchNumber } = useMatchStore();
    const { tournamentId } = useTournamentStore();
    // Disable refetchOnWindowFocus to prevent losing edits if user switches tabs
    // Only fetch when dialog is open to avoid unnecessary API calls
    const { data: teams, isFetching } = useTeams({ page: "all", refetchOnWindowFocus: false, enabled: open });
    const [editableStats, setEditableStats] = useState<EditableTeamStats[]>([]);
    const [initialEditableStats, setInitialEditableStats] = useState<EditableTeamStats[]>([]);
    // Track if we've initialized the form to prevent resetting on subsequent renders
    const [hasInitialized, setHasInitialized] = useState(false);
    // Track manually toggled player IDs (playerId -> current isAbsent status)
    const [manualToggles, setManualToggles] = useState<Map<string, boolean>>(new Map());
    // Track unknown players found in scoreboard but not in our list
    const [unknownPlayers, setUnknownPlayers] = useState<Array<{ name: string; kills: number; position?: number }>>([]);
    const queryClient = useQueryClient();

    // Validate positions and return warning messages
    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        const positions = editableStats
            .map((s) => (s.position === "" ? 0 : Number(s.position)))
            .filter((p) => p > 0);

        // If no positions filled yet, no warnings
        if (positions.length === 0) return errors;

        // Check that positions 1-8 are each filled at least once
        const filledPositions = new Set(positions);
        const missingPositions: number[] = [];
        for (let i = 1; i <= 8; i++) {
            if (!filledPositions.has(i)) {
                missingPositions.push(i);
            }
        }

        if (missingPositions.length > 0) {
            errors.push(`Missing positions: ${missingPositions.join(", ")}`);
        }

        return errors;
    }, [editableStats]);

    const hasValidationErrors = validationErrors.length > 0;

    // Reset initialization flag when dialog closes (so next open gets fresh data)
    useEffect(() => {
        if (!open) {
            setHasInitialized(false);
        }
    }, [open]);

    useEffect(() => {
        // Only initialize once per dialog open - don't reset when switching tabs
        if (teams && !hasInitialized) {
            // Check if ANY team has stats submitted (meaning scoreboard was saved for this match)
            const matchHasStats = teams.some((team: TeamT) =>
                team.teamPlayerStats && team.teamPlayerStats.length > 0
            );

            const stats = teams.map((team: TeamT) => {
                return {
                    teamId: team.id,
                    name: team.name,
                    position: team.position === 0 ? "" : team.position,
                    players: team.players.map((player) => {
                        const playerStats = team.teamPlayerStats?.find(
                            (ps) => ps.playerId === player.id
                        );
                        // Player is absent if: match has stats saved but this player doesn't have stats
                        // This works for solo players too - if any team has stats, the scoreboard was submitted
                        const wasAbsent = matchHasStats && !playerStats;

                        return {
                            playerId: player.id,
                            name: player.name,
                            displayName: player.displayName ?? null,
                            kills: playerStats?.kills === 0 ? "" : (playerStats?.kills ?? ""),
                            isAbsent: wasAbsent,
                        };
                    }),
                };
            });
            setEditableStats(stats);
            setInitialEditableStats(JSON.parse(JSON.stringify(stats))); // Deep copy for comparison
            setHasInitialized(true);
            // Clear manual toggles and unknown players when data is reset
            setManualToggles(new Map());
            setUnknownPlayers([]);
        }
    }, [teams, hasInitialized]);

    // Compare only the relevant data fields to detect actual changes
    const hasDataChanges = useCallback(() => {
        if (editableStats.length !== initialEditableStats.length) return true;

        for (let t = 0; t < editableStats.length; t++) {
            const current = editableStats[t];
            const initial = initialEditableStats[t];

            // Compare position
            if (current.position !== initial.position) return true;

            // Compare players
            if (current.players.length !== initial.players.length) return true;

            for (let p = 0; p < current.players.length; p++) {
                const currentPlayer = current.players[p];
                const initialPlayer = initial.players[p];

                // Compare kills (normalize empty string vs 0)
                const currentKills = currentPlayer.kills === "" || currentPlayer.kills === null ? "" : String(currentPlayer.kills);
                const initialKills = initialPlayer.kills === "" || initialPlayer.kills === null ? "" : String(initialPlayer.kills);
                if (currentKills !== initialKills) return true;

                // Compare isAbsent
                if (currentPlayer.isAbsent !== initialPlayer.isAbsent) return true;
            }
        }

        return false;
    }, [editableStats, initialEditableStats]);

    // Teams data is reset on dialog open/close via editableStats initialization

    const handlePositionChange = (index: number, value: string) => {
        const newStats = [...editableStats];
        newStats[index].position = value;
        setEditableStats(newStats);
    };

    const handleKillsChange = (
        teamIndex: number,
        playerIndex: number,
        value: string
    ) => {
        const newStats = [...editableStats];
        newStats[teamIndex].players[playerIndex].kills = value;
        setEditableStats(newStats);
    };

    // Toggle player absent/present status by clicking their name
    const handleToggleAbsent = (
        teamIndex: number,
        playerIndex: number
    ) => {
        const newStats = [...editableStats];
        const player = newStats[teamIndex].players[playerIndex];
        player.isAbsent = !player.isAbsent;
        // Clear kills if marking as absent
        if (player.isAbsent) {
            player.kills = "";
        }
        setEditableStats(newStats);

        // Track this as a manual toggle
        setManualToggles((prev) => {
            const updated = new Map(prev);
            updated.set(player.playerId, player.isAbsent);
            return updated;
        });
    };

    // Get list of manually toggled player names for the note
    const manuallyToggledPlayers = useMemo(() => {
        if (manualToggles.size === 0) return [];

        const toggledNames: string[] = [];
        editableStats.forEach((team) => {
            team.players.forEach((player) => {
                if (manualToggles.has(player.playerId)) {
                    const status = player.isAbsent ? "absent" : "present";
                    toggledNames.push(`${player.displayName || player.name} (${status})`);
                }
            });
        });
        return toggledNames;
    }, [editableStats, manualToggles]);

    // Process JSON text and apply to stats
    const processJsonText = useCallback((text: string) => {
        if (!teams) return;

        if (!text.trim()) {
            toast.error("No JSON data. Copy JSON from AI first, then paste here.");
            return;
        }

        try {
            // Parse the JSON input - kills can be number or null (null = absent)
            // isUnknown flag marks players not in our registered list
            const data = JSON.parse(text) as Array<{ name: string; kills: number | null; position?: number | null; isUnknown?: boolean }>;

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("Invalid JSON. Expected array like: [{name, kills, position}]");
            }

            // Build a set of all registered player names for matching
            // Use NFKC normalization + whitespace normalization to handle different unicode representations
            const normalizeName = (name: string) =>
                name.normalize('NFKC')
                    .toLowerCase()
                    // Remove zero-width characters (U+200B, U+200C, U+200D, U+FEFF)
                    .replace(/[\u200B-\u200D\uFEFF]/g, '')
                    // Replace all unicode whitespace variants with regular space
                    .replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g, ' ')
                    .trim();
            const registeredNames = new Set<string>();
            teams.forEach((team: TeamT) => {
                team.players.forEach((player) => {
                    registeredNames.add(normalizeName(player.name));
                    if (player.displayName) {
                        registeredNames.add(normalizeName(player.displayName));
                    }
                });
            });

            // Find unknown players from JSON
            const newUnknownPlayers: Array<{ name: string; kills: number; position?: number }> = [];
            data.forEach((d) => {
                if (d.isUnknown || !registeredNames.has(normalizeName(d.name))) {
                    if (d.kills !== null) {
                        newUnknownPlayers.push({
                            name: d.name,
                            kills: d.kills,
                            position: d.position ?? undefined,
                        });
                    }
                }
            });

            // Map to track team positions from JSON
            const teamPositions: Map<string, number> = new Map();
            let presentCount = 0;
            let absentCount = 0;

            // Create a copy of editableStats with kills and positions from JSON
            // Players with kills: null are marked as absent (red names, no death counted)
            const newStats: EditableTeamStats[] = teams.map((team: TeamT) => ({
                teamId: team.id,
                name: team.name,
                position: "" as string | number,
                players: team.players.map((player) => {
                    // Find matching player in JSON data - try displayName first, then userName
                    // Use NFKC normalization for consistent unicode comparison
                    const displayNameNorm = normalizeName(player.displayName || "");
                    const nameNorm = normalizeName(player.name);
                    const match = data.find(d => {
                        const jsonNameNorm = normalizeName(d.name);
                        return jsonNameNorm === displayNameNorm || jsonNameNorm === nameNorm;
                    });

                    // Determine if player is absent (not in JSON or kills is null)
                    const isAbsent = !match || match.kills === null;

                    if (isAbsent) {
                        absentCount++;
                    } else {
                        presentCount++;
                        // If match found with position, track it for the team
                        if (match?.position && !teamPositions.has(team.id)) {
                            teamPositions.set(team.id, match.position);
                        }
                    }

                    return {
                        playerId: player.id,
                        name: player.name,
                        displayName: player.displayName ?? null,
                        kills: (!isAbsent && match) ? String(match.kills) : ("" as string | number),
                        isAbsent,
                    };
                }),
            }));

            // Apply positions from JSON to teams
            newStats.forEach((team) => {
                const position = teamPositions.get(team.teamId);
                if (position !== undefined) {
                    team.position = String(position);
                }
            });

            setEditableStats(newStats);
            setUnknownPlayers(newUnknownPlayers);
            setManualToggles(new Map()); // Clear manual toggles on new paste

            const unknownMsg = newUnknownPlayers.length > 0 ? `, ${newUnknownPlayers.length} unknown` : "";
            toast.success(`Applied! ${presentCount} present, ${absentCount} absent${unknownMsg}`);
        } catch (error: unknown) {
            const err = error as Error;
            toast.error(err.message || "Failed to parse JSON");
        }
    }, [teams]);

    // Handle paste event from textarea
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const text = e.clipboardData.getData("text");
        processJsonText(text);
        // Clear the textarea after processing
        e.currentTarget.value = "";
    }, [processJsonText]);

    // Copy AI prompt to clipboard
    const copyPrompt = useCallback(() => {
        if (!teams) return;

        const totalTeams = teams.length;
        const totalPlayers = teams.reduce((acc, t) => acc + t.players.length, 0);

        // Build player list with displayName for better scoreboard matching
        const playerList = teams.flatMap(t => t.players.map(p => {
            const displayName = p.displayName || p.name;
            // If displayName differs from name, show both for context
            return displayName !== p.name ? `${displayName} (userName: ${p.name})` : p.name;
        }));

        const prompt = `Extract player names, kills (finishes), and team positions from this BGMI scoreboard.

Player names to match (USE THESE EXACT NAMES in output - use displayName if provided): 
${playerList.join(", ")}

Total: ${totalTeams} teams, ${totalPlayers} players

Teams and their players:
${teams.map(t => `- ${t.name}: ${t.players.map(p => p.displayName || p.name).join(", ")}`).join("\n")}

IMPORTANT:
- Return ALL ${totalPlayers} players from my list in the JSON
- For players FOUND in scoreboard: include their kills and position
- For players NOT FOUND in scoreboard (absent): set kills to null
- Match scoreboard names to the player list above (ignore special characters/symbols when matching)
- In the JSON output, use the EXACT name from MY list above, NOT the scoreboard name
- Example: if scoreboard shows "ツREAL乂SNAR" and my list has "realxsnar", return "realxsnar"
- Position = the rank number shown next to each team (1, 2, 3, etc.)
- The crown icon = position 1
- Players in the same row belong to the same team
- If uploading multiple images, combine ALL results into ONE JSON array
- Flag any player with 10+ kills (unusual, double-check)
- UNKNOWN PLAYERS: If you find players in the scoreboard who are NOT in my list, add them with "isUnknown": true

Return format (MUST include all ${totalPlayers} players + any unknown):
[
  {"name": "present_player", "kills": 5, "position": 1},
  {"name": "absent_player", "kills": null, "position": null},
  {"name": "unknown_scoreboard_name", "kills": 3, "position": 2, "isUnknown": true},
  ...
]

After the JSON (ONLY show sections that have items):
Players found: X/${totalPlayers}
Players absent: X (list names)
🆕 Unknown players: X (list names - players in scoreboard but not in my list)
⚠️ High kills (10+): player_name (X kills)
⚠️ Uncertain matches: scoreboard_name → matched_name`;

        navigator.clipboard.writeText(prompt);
        toast.success("Prompt copied to clipboard!");
    }, [teams]);

    const { setPendingRefetch } = usePendingRefetch();

    const { mutate, isPending } = useMutation({
        mutationFn: (data: { stats: TeamStatsForm[] }) =>
            http.put(
                ADMIN_MATCH_ENDPOINTS.PUT_BULK_UPDATE_MATCH_STATS.replace(":id", matchId),
                data
            ),
        onSuccess: () => {
            // Set pending refetch flag - refetch button will change color
            setPendingRefetch(true);
            toast.success("Stats saved! Click Refetch when ready.");
            onOpenChange(false);
        },
        onError: (error: Error & { message?: string; response?: { data?: { message?: string }; status?: number } }) => {
            // Build a user-friendly error message
            let errorMsg = error.response?.data?.message || error.message || "Failed to update stats";

            // Handle specific error cases with clearer messages
            if (errorMsg.toLowerCase().includes("timeout") || errorMsg.toLowerCase().includes("expired transaction")) {
                errorMsg = "Save timed out - too many players. Try again or contact support.";
            } else if (error.response?.status === 500) {
                errorMsg = "Server error - please try again. If this persists, contact support.";
            }

            toast.error(errorMsg);
        },
    });

    const handleSave = () => {
        const payload = editableStats.map((stat) => ({
            teamId: stat.teamId,
            position: stat.position === "" ? 0 : Number(stat.position),
            // Only include players who are NOT absent (were found in JSON/scoreboard)
            // Absent players (not in JSON) don't count as having played
            players: stat.players
                .filter((p) => !p.isAbsent)
                .map((p) => ({
                    playerId: p.playerId,
                    kills: p.kills === "" ? 0 : Number(p.kills),
                    deaths: 1,
                })),
        }));

        mutate({ stats: payload });
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // Auto-scroll to make input visible on mobile when keyboard opens
        if (window.innerWidth < 640) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-4xl sm:max-w-6xl max-h-[90vh] h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden p-0 gap-0 [&>button]:hidden">
                {/* Scrollable content including header, buttons, and teams */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5">
                    {/* HEADER - scrolls with content */}
                    <DialogHeader className="p-3 sm:p-4 bg-background">
                        <DialogTitle className="text-lg font-semibold">Bulk Edit Stats{matchNumber ? ` - Match ${matchNumber}` : ""}</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Edit position and kills for all teams in this match.
                        </DialogDescription>
                    </DialogHeader>

                    {/* AI BUTTONS - Copy Prompt & Paste JSON */}
                    <div className="flex gap-2 mb-3 px-3 sm:px-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={copyPrompt}
                            className="gap-2 flex-1 sm:flex-none"
                        >
                            📋 Copy Prompt
                        </Button>
                        {/* Textarea - hidden on mobile */}
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
                            className="gap-2 flex-1 sm:flex-none"
                        >
                            📥 Paste
                        </Button>
                    </div>

                    {isFetching ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <LoaderFive text="Loading teams..." />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {editableStats.map((team, teamIndex) => {
                                const hasPositionData = team.position !== "" && team.position !== 0;
                                const hasAnyKills = team.players.some(p => p.kills !== "" && p.kills !== 0);
                                const hasTeamData = hasPositionData || hasAnyKills;

                                const cardBg = hasTeamData
                                    ? "bg-emerald-500/25 dark:bg-emerald-500/30"
                                    : teamIndex % 2 === 0
                                        ? "bg-background"
                                        : "bg-black/20 dark:bg-white/10";

                                return (
                                    <div
                                        key={team.teamId}
                                        className={`rounded-lg border p-3 ${cardBg}`}
                                    >
                                        {/* Team Name Header */}
                                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                            <span className="font-medium text-sm truncate flex-1">
                                                {(() => {
                                                    // Get absent player info (for matching and clicking)
                                                    const playerInfoMap = new Map(team.players.map((p, idx) => [
                                                        (p.displayName || p.name).toLowerCase(),
                                                        { player: p, playerIndex: idx }
                                                    ]));
                                                    // Also add userName as key
                                                    team.players.forEach((p, idx) => {
                                                        playerInfoMap.set(p.name.toLowerCase(), { player: p, playerIndex: idx });
                                                    });

                                                    // Split team name by underscores and make each part clickable
                                                    const parts = team.name.split('_');
                                                    return parts.map((part, i) => {
                                                        // Find matching player for this part
                                                        const partLower = part.toLowerCase();
                                                        let matchedPlayer: { player: typeof team.players[0]; playerIndex: number } | undefined;

                                                        for (const [name, info] of playerInfoMap.entries()) {
                                                            if (partLower.includes(name) || name.includes(partLower)) {
                                                                matchedPlayer = info;
                                                                break;
                                                            }
                                                        }

                                                        const isAbsent = matchedPlayer?.player.isAbsent ?? false;

                                                        return (
                                                            <span key={i}>
                                                                {i > 0 && '_'}
                                                                <span
                                                                    onClick={matchedPlayer ? () => handleToggleAbsent(teamIndex, matchedPlayer!.playerIndex) : undefined}
                                                                    className={`${isAbsent ? "text-red-600 dark:text-red-400" : ""} ${matchedPlayer ? "cursor-pointer hover:underline" : ""}`}
                                                                    title={matchedPlayer ? `Click to ${isAbsent ? "mark present" : "mark absent"}` : undefined}
                                                                >
                                                                    {part}
                                                                </span>
                                                            </span>
                                                        );
                                                    });
                                                })()}
                                            </span>
                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                                    Position:
                                                </span>
                                                <span className="text-xs text-muted-foreground sm:hidden">
                                                    #
                                                </span>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="20"
                                                    value={team.position}
                                                    onChange={(e) => handlePositionChange(teamIndex, e.target.value)}
                                                    className="w-12 sm:w-16 h-8 text-center text-sm"
                                                    placeholder="#"
                                                />
                                            </div>
                                        </div>

                                        {/* Players Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                            {team.players.map((player, playerIndex) => (
                                                <div
                                                    key={player.playerId}
                                                    onClick={() => handleToggleAbsent(teamIndex, playerIndex)}
                                                    className={`flex items-center gap-1.5 sm:gap-2 bg-muted/40 rounded-md px-2 py-1 cursor-pointer hover:bg-muted/60 transition-colors ${player.isAbsent ? "ring-1 ring-red-500/50" : ""}`}
                                                    title={`Click to ${player.isAbsent ? "mark present" : "mark absent"}`}
                                                >
                                                    <span
                                                        className={`text-xs truncate flex-1 min-w-0 select-none ${player.isAbsent
                                                            ? "text-red-600 dark:text-red-400 font-medium"
                                                            : ""
                                                            }`}
                                                    >
                                                        {player.displayName || player.name}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={player.kills}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => handleKillsChange(teamIndex, playerIndex, e.target.value)}
                                                        className="w-10 sm:w-12 h-6 text-center text-xs flex-shrink-0"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Notes Section - Manual Changes & Unknown Players */}
                            {(manuallyToggledPlayers.length > 0 || unknownPlayers.length > 0) && (
                                <div className="mt-4 p-4 rounded-md bg-blue-500/10 border border-blue-500/30 shadow-sm space-y-2">
                                    {manuallyToggledPlayers.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                ✏️ Manual Changes ({manuallyToggledPlayers.length})
                                            </p>
                                            <p className="text-sm text-blue-600/90 dark:text-blue-400">
                                                {manuallyToggledPlayers.slice(0, 10).join(", ")}
                                                {manuallyToggledPlayers.length > 10 && ` +${manuallyToggledPlayers.length - 10} more`}
                                            </p>
                                        </div>
                                    )}
                                    {unknownPlayers.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                                🆕 Unknown Players ({unknownPlayers.length})
                                            </p>
                                            <p className="text-sm text-orange-600/90 dark:text-orange-400">
                                                {unknownPlayers.slice(0, 10).map(p => `${p.name} (${p.kills} kills)`).join(", ")}
                                                {unknownPlayers.length > 10 && ` +${unknownPlayers.length - 10} more`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Validation Warnings */}
                            {validationErrors.length > 0 && (
                                <div className="mt-4 p-4 rounded-md bg-yellow-500/10 border border-yellow-500/30 shadow-sm">
                                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-500 mb-2 flex items-center gap-2">
                                        ⚠️ Validation Warnings
                                    </p>
                                    <ul className="text-sm text-yellow-600/90 dark:text-yellow-400 space-y-1 list-disc list-inside">
                                        {validationErrors.map((error, idx) => (
                                            <li key={idx}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <DialogFooter className="p-3 sm:p-4 border-t bg-background flex-shrink-0 z-10">
                    <div className="flex w-full gap-3 sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 sm:flex-none h-10 sm:h-11"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleSave}
                            disabled={isPending || !hasDataChanges()}
                            className="flex-1 sm:flex-none h-10 sm:h-11 font-semibold shadow-md"
                            title={!hasDataChanges() ? "No changes to save" : ""}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}