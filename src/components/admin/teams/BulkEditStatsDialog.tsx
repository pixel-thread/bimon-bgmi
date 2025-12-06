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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";
import { useTeams } from "@/src/hooks/team/useTeams";
import { useMatches } from "@/src/hooks/match/useMatches";
import { Loader2, RefreshCw } from "lucide-react";
import { ADMIN_MATCH_ENDPOINTS } from "@/src/lib/endpoints/admin/match";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { TeamStatsForm } from "@/src/utils/validation/team/team-stats";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useRef } from "react";
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
    const { matchId } = useMatchStore();
    const { data: teams, isFetching, refetch: refetchTeams } = useTeams({ page: "all" });
    const { data: matches } = useMatches();
    const [editableStats, setEditableStats] = useState<EditableTeamStats[]>([]);
    const queryClient = useQueryClient();

    // Check if current match is still processing
    const currentMatch = matches?.find((m) => m.id === matchId);
    const isMatchProcessing = currentMatch?.status === "PROCESSING";

    // Track if processing just finished (was processing, now ready)
    const wasProcessingRef = useRef(false);
    const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
    const [isBulkEditSave, setIsBulkEditSave] = useState(false);

    // Check session storage on mount to see if this was a bulk edit save
    useEffect(() => {
        if (open && matchId) {
            const isBulk = sessionStorage.getItem(`bulk_edit_processing_${matchId}`);
            setIsBulkEditSave(!!isBulk);
        }
    }, [open, matchId]);

    useEffect(() => {
        if (isMatchProcessing) {
            wasProcessingRef.current = true;
            setShowRefreshPrompt(false);
        } else if (wasProcessingRef.current && !isMatchProcessing) {
            // Processing just finished
            wasProcessingRef.current = false;

            // Only show refresh prompt if it was a bulk edit save
            if (isBulkEditSave) {
                setShowRefreshPrompt(true);
                sessionStorage.removeItem(`bulk_edit_processing_${matchId}`);
                setIsBulkEditSave(false);
            } else {
                // If it was match creation, just refetch automatically to be safe
                refetchTeams();
            }
        }
    }, [isMatchProcessing, isBulkEditSave, matchId, refetchTeams]);

    const handleRefresh = () => {
        refetchTeams();
        setShowRefreshPrompt(false);
    };

    // Validate positions and return warning messages
    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        const positions = editableStats
            .map((s) => (s.position === "" ? 0 : Number(s.position)))
            .filter((p) => p > 0);

        // If no positions filled yet, no warnings
        if (positions.length === 0) return errors;

        // Rule: Total must always be 8 teams
        if (positions.length !== 8) {
            errors.push(`Need exactly 8 positions filled (currently ${positions.length})`);
        }

        // Count occurrences of each position
        const positionCounts: Record<number, number> = {};
        positions.forEach((pos) => {
            positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });

        // Rule: Positions can only be 1-8
        const invalidPositions = positions.filter((p) => p < 1 || p > 8);
        if (invalidPositions.length > 0) {
            errors.push(`Invalid positions: ${invalidPositions.join(', ')} (only 1-8 allowed)`);
        }

        // Rule: Positions 1-6 must be unique (exactly one team each)
        for (let i = 1; i <= 6; i++) {
            const count = positionCounts[i] || 0;
            if (count === 0) {
                errors.push(`Position ${i} is missing`);
            } else if (count > 1) {
                errors.push(`Position ${i} has ${count} teams (must be unique)`);
            }
        }

        // Rule: Exactly one duplicate allowed, only at position 7 or 8
        const pos7Count = positionCounts[7] || 0;
        const pos8Count = positionCounts[8] || 0;

        // Valid combinations for positions 7 and 8:
        // - 7:1, 8:1 (both unique) = valid
        // - 7:2, 8:0 (7 has duplicate, no 8) = valid
        // - 7:0, 8:2 (8 has duplicate, no 7) = valid
        const validCombos = [
            pos7Count === 1 && pos8Count === 1,  // 1,2,3,4,5,6,7,8
            pos7Count === 2 && pos8Count === 0,  // 1,2,3,4,5,6,7,7
            pos7Count === 0 && pos8Count === 2,  // 1,2,3,4,5,6,8,8
        ];

        if (!validCombos.some(Boolean) && positions.length === 8) {
            if (pos7Count > 2) {
                errors.push(`Position 7 has ${pos7Count} teams (max 2 allowed)`);
            }
            if (pos8Count > 2) {
                errors.push(`Position 8 has ${pos8Count} teams (max 2 allowed)`);
            }
            if (pos7Count === 2 && pos8Count > 0) {
                errors.push(`Cannot have both position 7 duplicate and position 8`);
            }
            if (pos8Count === 2 && pos7Count > 0) {
                errors.push(`Cannot have both position 8 duplicate and position 7`);
            }
            if (pos7Count === 0 && pos8Count === 0) {
                errors.push(`Missing positions 7 and 8`);
            } else if (pos7Count === 1 && pos8Count === 0) {
                errors.push(`Position 8 is missing (or make position 7 a duplicate)`);
            } else if (pos7Count === 0 && pos8Count === 1) {
                errors.push(`Position 7 is missing (or make position 8 a duplicate)`);
            }
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

    const { mutate, isPending } = useMutation({
        mutationFn: (data: { stats: TeamStatsForm[] }) =>
            http.put(
                ADMIN_MATCH_ENDPOINTS.PUT_BULK_UPDATE_MATCH_STATS.replace(":id", matchId),
                data
            ),
        onSuccess: () => {
            toast.success("Stats update started - processing in background");
            // Mark this as a bulk edit save
            sessionStorage.setItem(`bulk_edit_processing_${matchId}`, "true");
            setIsBulkEditSave(true);

            // Invalidate matches to show orange dot
            queryClient.invalidateQueries({ queryKey: ["match"] });
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update stats");
        },
    });

    const handleSave = () => {
        const payload = editableStats.map((stat) => ({
            teamId: stat.teamId,
            matchId,
            position: stat.position === "" ? 0 : Number(stat.position),
            players: stat.players.map((p) => ({
                playerId: p.playerId,
                kills: p.kills === "" ? 0 : Number(p.kills),
                deaths: 0,
            })),
        }));

        mutate({ stats: payload });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-4xl sm:max-w-6xl max-h-[85vh] h-[85vh] flex flex-col overflow-hidden p-0 sm:p-2">
                {/* SCROLLABLE SECTION */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {/* HEADER - Now inside scrollable area */}
                    <DialogHeader className="p-2 sm:p-3 border-b flex-shrink-0">
                        <DialogTitle className="text-sm sm:text-base">Bulk Edit Stats</DialogTitle>
                        <DialogDescription className="text-xs">
                            Edit position and kills for all teams in this match.
                        </DialogDescription>
                        {isMatchProcessing && (
                            <div className="mt-2 p-2 rounded-md bg-orange-500/10 border border-orange-500/30 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-xs font-medium text-orange-500">
                                        {isBulkEditSave ? "Saving changes in background..." : "Setting up match stats..."}
                                    </span>
                                </div>
                                <span className="text-xs text-orange-400">
                                    {isBulkEditSave
                                        ? "Your previous changes are still being saved. Data shown may be outdated."
                                        : "Please wait while we initialize stats for all teams."}
                                </span>
                            </div>
                        )}
                        {showRefreshPrompt && !isMatchProcessing && (
                            <div className="mt-2 p-2 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                                <span className="text-xs text-green-500">Processing complete! Refresh to see latest data.</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs text-green-500 hover:text-green-600"
                                    onClick={handleRefresh}
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Refresh
                                </Button>
                            </div>
                        )}
                    </DialogHeader>

                    {isFetching ? (
                        <div className="p-2 flex items-center justify-center">
                            <LoaderFive text="Loading teams..." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow className="border-b">
                                        <TableHead className="min-w-[60px] p-1 sm:p-1.5 text-xs">Pos</TableHead>
                                        <TableHead className="min-w-[80px] sm:w-[150px] md:w-[200px] p-1 sm:p-1.5 text-xs">Team</TableHead>
                                        <TableHead className="p-1 sm:p-1.5 text-xs sm:min-w-[300px]">Players (Kills)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {editableStats.map((team, teamIndex) => {
                                        const hasPositionData = team.position !== "" && team.position !== 0;
                                        const hasAnyKills = team.players.some(p => p.kills !== "" && p.kills !== 0);
                                        const hasTeamData = hasPositionData || hasAnyKills;
                                        const isSoloPlayer = team.players.length === 1;

                                        // Determine row background: edited (emerald) > odd (subtle bg) > even (transparent)
                                        const rowBg = hasTeamData
                                            ? "bg-emerald-500/15"
                                            : teamIndex % 2 === 0
                                                ? "bg-zinc-500/15"
                                                : "bg-zinc-500/8";

                                        return (
                                            <TableRow
                                                key={team.teamId}
                                                className={`border-b last:border-b-0 hover:bg-accent/50 ${rowBg}`}
                                            >
                                                <TableCell className="p-1 sm:p-1.5 min-w-[60px]">
                                                    <Input
                                                        type="number"
                                                        value={team.position}
                                                        onChange={(e) => handlePositionChange(teamIndex, e.target.value)}
                                                        disabled={isMatchProcessing && isBulkEditSave}
                                                        className="w-full h-8 sm:h-9 text-sm font-semibold text-center px-1"
                                                        placeholder="0"
                                                    />
                                                </TableCell>

                                                <TableCell className="p-1 sm:p-1.5 font-medium">
                                                    <span className="block text-xs sm:text-sm truncate" title={team.name}>
                                                        {team.name}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="p-1 sm:p-1.5">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:min-w-[300px]">
                                                        {team.players.map((player, playerIndex) => (
                                                            <div
                                                                key={player.playerId}
                                                                className={`flex ${isSoloPlayer ? "flex-row items-center" : "flex-col sm:flex-row items-start sm:items-center"} gap-0.5 sm:gap-1 bg-muted/20 rounded p-1`}
                                                            >
                                                                {/* Hide player name for solo players */}
                                                                {!isSoloPlayer && (
                                                                    <span
                                                                        className="text-xs truncate w-full sm:w-16 font-medium text-foreground/90"
                                                                        title={player.name}
                                                                    >
                                                                        {player.name}
                                                                    </span>
                                                                )}
                                                                <Input
                                                                    type="number"
                                                                    value={player.kills}
                                                                    onChange={(e) =>
                                                                        handleKillsChange(teamIndex, playerIndex, e.target.value)
                                                                    }
                                                                    disabled={isMatchProcessing && isBulkEditSave}
                                                                    className={`${isSoloPlayer ? "w-16" : "mt-1 w-12 self-end sm:mt-0"} h-7 sm:h-8 text-xs text-center flex-shrink-0 px-0.5`}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Validation Warnings (non-blocking) */}
                    {validationErrors.length > 0 && (
                        <div className="mx-2 my-2 p-2 rounded-md bg-yellow-500/10 border border-yellow-500/30">
                            <p className="text-xs font-semibold text-yellow-500 mb-1">⚠️ Warnings:</p>
                            <ul className="text-xs text-yellow-400 list-disc list-inside space-y-0.5">
                                {validationErrors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <DialogFooter className="p-2 sm:p-3 border-t flex flex-row items-center justify-end gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none text-xs sm:text-sm py-1.5 sm:py-2 h-9"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isPending || isMatchProcessing}
                        className="flex-1 sm:flex-none text-xs sm:text-sm py-1.5 sm:py-2 h-9"
                    >
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}