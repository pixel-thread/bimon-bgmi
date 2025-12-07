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
        onSuccess: (response: { message?: string }) => {
            // Check if it was processed synchronously (message contains "successfully")
            const wasSync = response.message?.includes("successfully");

            if (wasSync) {
                toast.success("Stats saved successfully!");
            } else {
                toast.success("Stats update started - processing in background");
                // Mark this as a bulk edit save for background processing
                sessionStorage.setItem(`bulk_edit_processing_${matchId}`, "true");
                setIsBulkEditSave(true);
            }

            // Invalidate queries to refresh data
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
            players: stat.players.map((p) => ({
                playerId: p.playerId,
                kills: p.kills === "" ? 0 : Number(p.kills),
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
                    <DialogTitle className="text-lg font-semibold">Bulk Edit Stats</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Edit position and kills for all teams in this match.
                    </DialogDescription>
                    {isMatchProcessing && (
                        <div className="mt-3 p-3 rounded-md bg-orange-500/10 border border-orange-500/30 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                <span className="text-sm font-medium text-orange-500">
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
                        <div className="mt-3 p-3 rounded-md bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                            <span className="text-sm font-medium text-green-500">Processing complete! Refresh to see latest data.</span>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-xs text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={handleRefresh}
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                Refresh
                            </Button>
                        </div>
                    )}
                </DialogHeader>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5">
                    {isFetching ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <LoaderFive text="Loading teams..." />
                        </div>
                    ) : (
                        <div className="p-1 sm:p-4 pb-20 sm:pb-6">
                            <div className="overflow-hidden rounded-md border bg-background shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="w-[80px] text-center font-semibold">Pos</TableHead>
                                            <TableHead className="min-w-[150px] font-semibold">Team Name</TableHead>
                                            <TableHead className="min-w-[300px] font-semibold">Players (Kills)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {editableStats.map((team, teamIndex) => {
                                            const hasPositionData = team.position !== "" && team.position !== 0;
                                            const hasAnyKills = team.players.some(p => p.kills !== "" && p.kills !== 0);
                                            const hasTeamData = hasPositionData || hasAnyKills;
                                            const isSoloPlayer = team.players.length === 1;

                                            // Determine row background
                                            const rowBg = hasTeamData
                                                ? "bg-emerald-500/10 dark:bg-emerald-500/15"
                                                : teamIndex % 2 === 0
                                                    ? "bg-background"
                                                    : "bg-muted/30";

                                            return (
                                                <TableRow
                                                    key={team.teamId}
                                                    className={`hover:bg-accent/50 transition-colors ${rowBg}`}
                                                >
                                                    <TableCell className="p-2 sm:p-3 text-center align-top">
                                                        <Input
                                                            type="number"
                                                            value={team.position}
                                                            onFocus={handleFocus}
                                                            onChange={(e) => handlePositionChange(teamIndex, e.target.value)}
                                                            disabled={isMatchProcessing && isBulkEditSave}
                                                            className="w-full h-9 sm:h-10 text-base font-semibold text-center shadow-sm"
                                                            placeholder="-"
                                                        />
                                                    </TableCell>

                                                    <TableCell className="p-2 sm:p-3 align-top pt-3.5 sm:pt-4">
                                                        <span className="text-sm font-semibold block mb-1">
                                                            {team.name}
                                                        </span>
                                                    </TableCell>

                                                    <TableCell className="p-2 sm:p-3">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {team.players.map((player, playerIndex) => (
                                                                <div
                                                                    key={player.playerId}
                                                                    className={`flex items-center gap-2 rounded-md border bg-background/50 p-1.5 sm:p-2 shadow-sm ${player.kills !== "" && player.kills !== 0
                                                                        ? "border-emerald-500/30 bg-emerald-500/5"
                                                                        : "border-border"
                                                                        }`}
                                                                >
                                                                    {!isSoloPlayer && (
                                                                        <span
                                                                            className="text-xs sm:text-sm truncate flex-1 font-medium"
                                                                            title={player.name}
                                                                        >
                                                                            {player.name}
                                                                        </span>
                                                                    )}
                                                                    <Input
                                                                        type="number"
                                                                        value={player.kills}
                                                                        onFocus={handleFocus}
                                                                        onChange={(e) =>
                                                                            handleKillsChange(teamIndex, playerIndex, e.target.value)
                                                                        }
                                                                        disabled={isMatchProcessing && isBulkEditSave}
                                                                        className={`${isSoloPlayer ? "w-full text-left pl-3" : "w-14 text-center"} h-8 sm:h-9 text-sm font-medium`}
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
                            disabled={isPending || isMatchProcessing}
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