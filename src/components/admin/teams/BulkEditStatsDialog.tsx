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
import { useEffect, useState, useMemo } from "react";
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
                </DialogHeader>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto min-h-0 bg-muted/5">
                    {isFetching ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-muted-foreground">
                            <LoaderFive text="Loading teams..." />
                        </div>
                    ) : (
                        <div className="p-1 sm:p-4 pb-20 sm:pb-6">
                            <div className="space-y-2">
                                {editableStats.map((team, teamIndex) => {
                                    const hasPositionData = team.position !== "" && team.position !== 0;
                                    const hasAnyKills = team.players.some(p => p.kills !== "" && p.kills !== 0);
                                    const hasTeamData = hasPositionData || hasAnyKills;

                                    // Determine card background - bolder colors for visibility
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
                                            <div className="text-sm font-bold mb-2 text-foreground/90 truncate" title={team.name}>
                                                {team.name}
                                            </div>

                                            {/* Two Column Layout: 30% Position, 70% Kills */}
                                            <div className="grid grid-cols-[30%_70%] gap-3 items-center">
                                                {/* Position Column - vertically centered with kills */}
                                                <div className="flex items-center justify-center">
                                                    <Input
                                                        type="number"
                                                        value={team.position}
                                                        onFocus={handleFocus}
                                                        onChange={(e) => handlePositionChange(teamIndex, e.target.value)}
                                                        className="w-full max-w-[80px] h-10 text-lg font-semibold text-center shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        placeholder="0"
                                                    />
                                                </div>

                                                {/* Kills Column - wraps to multiple rows */}
                                                <div className="flex flex-wrap gap-2 content-center">
                                                    {team.players.map((player, playerIndex) => (
                                                        <Input
                                                            key={player.playerId}
                                                            type="number"
                                                            value={player.kills}
                                                            onFocus={handleFocus}
                                                            onChange={(e) =>
                                                                handleKillsChange(teamIndex, playerIndex, e.target.value)
                                                            }
                                                            className={`w-[calc(50%-4px)] h-10 text-sm font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${player.kills !== "" && player.kills !== 0
                                                                ? "border-emerald-500/50 bg-emerald-500/10"
                                                                : ""
                                                                }`}
                                                            placeholder={player.name}
                                                            title={player.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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