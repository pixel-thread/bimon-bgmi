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
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { TeamStatsForm } from "@/src/utils/validation/team/team-stats";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { LoaderFive } from "../../ui/loader";

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
        kills: string | number;
    }[];
};

export function BulkEditStatsDialog({ open, onOpenChange }: Props) {
    const { matchId, matchNumber } = useMatchStore();
    const { data: teams, isFetching } = useTeams({ page: "all" });
    const [editableStats, setEditableStats] = useState<EditableTeamStats[]>([]);
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

    useEffect(() => {
        if (teams) {
            const stats = teams.map((team: TeamT) => ({
                teamId: team.id,
                name: team.name,
                position: team.position === 0 ? "" : team.position,
                players: team.players.map((player) => {
                    const playerStats = team.teamPlayerStats?.find(
                        (ps) => ps.playerId === player.id
                    );
                    return {
                        playerId: player.id,
                        name: player.name,
                        kills: playerStats?.kills === 0 ? "" : (playerStats?.kills ?? ""),
                    };
                }),
            }));
            setEditableStats(stats);
        }
    }, [teams]);

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

    // Process JSON text and apply to stats
    const processJsonText = useCallback((text: string) => {
        if (!teams) return;

        if (!text.trim()) {
            toast.error("No JSON data. Copy JSON from AI first, then paste here.");
            return;
        }

        try {
            // Parse the JSON input
            const data = JSON.parse(text) as Array<{ name: string; kills: number; position?: number }>;

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("Invalid JSON. Expected array like: [{name, kills, position}]");
            }

            // Map to track team positions from JSON
            const teamPositions: Map<string, number> = new Map();

            // Create a copy of editableStats with kills and positions from JSON
            const newStats: EditableTeamStats[] = teams.map((team: TeamT) => ({
                teamId: team.id,
                name: team.name,
                position: "" as string | number,
                players: team.players.map((player) => {
                    // Find matching player in JSON data
                    const match = data.find(d =>
                        d.name.toLowerCase() === player.name.toLowerCase()
                    );

                    // If match found and has position, track it for the team
                    if (match?.position && !teamPositions.has(team.id)) {
                        teamPositions.set(team.id, match.position);
                    }

                    return {
                        playerId: player.id,
                        name: player.name,
                        kills: match ? String(match.kills) : ("" as string | number),
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
            toast.success(`Applied ${data.length} players!`);
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

        const prompt = `Extract player names, kills (finishes), and team positions from this BGMI scoreboard.

Player names to match (USE THESE EXACT NAMES in output): 
${teams.flatMap(t => t.players.map(p => p.name)).join(", ")}

Total: ${totalTeams} teams, ${totalPlayers} players

Teams and their players:
${teams.map(t => `- ${t.name}: ${t.players.map(p => p.name).join(", ")}`).join("\n")}

IMPORTANT:
- Match scoreboard names to the player list above (ignore special characters/symbols when matching)
- In the JSON output, use the EXACT name from MY list above, NOT the scoreboard name
- Example: if scoreboard shows "ツREAL乂SNAR" and my list has "realxsnar", return "realxsnar"
- Position = the rank number shown next to each team (1, 2, 3, etc.)
- The crown icon = position 1
- Players in the same row belong to the same team
- If uploading multiple images, combine ALL results into ONE JSON array
- Flag any player with 10+ kills (unusual, double-check)
- Flag if any player appears more than once in the scoreboard

Return format:
[{"name": "player_name_from_my_list", "kills": 0, "position": 1}, ...]

After the JSON (ONLY show sections that have items, skip any that are empty):
Players found: X/${totalPlayers}
⚠️ High kills (10+): player_name (X kills)
⚠️ Duplicates: player_name (appeared X times)
⚠️ Uncertain matches: scoreboard_name → matched_name
Missing players: player1, player2
New players: new_player1, new_player2`;

        navigator.clipboard.writeText(prompt);
        toast.success("Prompt copied to clipboard!");
    }, [teams]);

    const { mutate, isPending } = useMutation({
        mutationFn: (data: { stats: TeamStatsForm[] }) =>
            http.put(
                ADMIN_MATCH_ENDPOINTS.PUT_BULK_UPDATE_MATCH_STATS.replace(":id", matchId),
                data
            ),
        onSuccess: () => {
            toast.success("Stats saved successfully!");
            queryClient.invalidateQueries({ queryKey: ["match"] });
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            onOpenChange(false);
        },
        onError: (error: Error & { message?: string }) => {
            toast.error(error.message || "Failed to update stats");
        },
    });

    const handleSave = () => {
        const payload = editableStats.map((stat) => ({
            teamId: stat.teamId,
            matchId,
            position: stat.position === "" ? 0 : Number(stat.position),
            // Only include players who have kills data (were in scoreboard)
            // Empty kills ("") = NOT in scoreboard = no death count
            // Kills of 0 = WAS in scoreboard with 0 kills = should count death
            players: stat.players
                .filter((p) => p.kills !== "")
                .map((p) => ({
                    playerId: p.playerId,
                    kills: Number(p.kills),
                    deaths: 0,
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
            <DialogContent className="w-full max-w-4xl sm:max-w-6xl max-h-[90vh] h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
                {/* HEADERS */}
                <DialogHeader className="p-3 sm:p-4 border-b flex-shrink-0 bg-background z-10">
                    <DialogTitle className="text-lg font-semibold">Bulk Edit Stats{matchNumber ? ` - Match ${matchNumber}` : ""}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Edit position and kills for all teams in this match.
                    </DialogDescription>
                </DialogHeader>

                {/* AI BUTTONS - Copy Prompt & Paste JSON */}
                <div className="px-3 sm:px-4 pt-3 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyPrompt}
                        className="gap-2 w-full sm:w-auto"
                    >
                        📋 Copy Prompt
                    </Button>
                    <div className="flex gap-2 flex-1">
                        <textarea
                            onPaste={handlePaste}
                            placeholder="Click & Ctrl+V"
                            className="flex-1 h-9 px-3 py-2 text-sm rounded-md border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button
                            variant="default"
                            size="sm"
                            onClick={async () => {
                                try {
                                    const text = await navigator.clipboard.readText();
                                    processJsonText(text);
                                } catch {
                                    toast.error("Click the input and use Ctrl+V");
                                }
                            }}
                            className="gap-2 flex-shrink-0"
                        >
                            📥 Paste
                        </Button>
                    </div>
                </div>

                {/* TEAM CARDS */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5 p-1 sm:p-4 pb-20 sm:pb-6">
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
                                                {team.name}
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
                                                    className="flex items-center gap-1.5 sm:gap-2 bg-muted/40 rounded-md px-2 py-1"
                                                >
                                                    <span className="text-xs truncate flex-1 min-w-0" title={player.name}>
                                                        {player.name}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={player.kills}
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
                            disabled={isPending}
                            className="flex-1 sm:flex-none h-10 sm:h-11 font-semibold shadow-md"
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