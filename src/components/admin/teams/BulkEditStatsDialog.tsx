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
import { ADMIN_MATCH_ENDPOINTS } from "@/src/lib/endpoints/admin/match";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { TeamT } from "@/src/types/team";
import http from "@/src/utils/http";
import { TeamStatsForm } from "@/src/utils/validation/team/team-stats";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
            toast.success("Stats updated successfully");
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
            <DialogContent className="w-full max-w-4xl sm:max-w-6xl max-h-[95vh] h-[95vh] flex flex-col overflow-hidden p-0 sm:p-2">
                {/* HEADER */}
                <DialogHeader className="p-2 sm:p-3 border-b flex-shrink-0">
                    <DialogTitle className="text-sm sm:text-base">Bulk Edit Stats</DialogTitle>
                    <DialogDescription className="text-xs">
                        Edit position and kills for all teams in this match.
                    </DialogDescription>
                </DialogHeader>

                {/* SCROLLABLE SECTION */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {isFetching ? (
                        <div className="p-2 flex items-center justify-center">
                            <LoaderFive text="Loading teams..." />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className="min-w-full [&>thead]:sticky top-0 z-10 bg-background">
                                <TableHeader>
                                    <TableRow className="border-b">
                                        <TableHead className="min-w-[60px] p-1 sm:p-1.5 text-xs">Pos</TableHead>
                                        <TableHead className="min-w-[80px] sm:w-[150px] md:w-[200px] p-1 sm:p-1.5 text-xs">Team</TableHead>
                                        <TableHead className="p-1 sm:p-1.5 text-xs sm:min-w-[300px]">Players (Kills)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {editableStats.map((team, teamIndex) => (
                                        <TableRow key={team.teamId} className="border-b last:border-b-0 hover:bg-accent/50">
                                            <TableCell className="p-1 sm:p-1.5 min-w-[60px]">
                                                <Input
                                                    type="number"
                                                    value={team.position}
                                                    onChange={(e) => handlePositionChange(teamIndex, e.target.value)}
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
                                                            className="flex flex-col sm:flex-row items-start sm:items-center gap-0.5 sm:gap-1 bg-muted/20 rounded p-1"
                                                        >
                                                            <span
                                                                className="text-xs truncate w-full sm:w-16 font-medium text-foreground/90"
                                                                title={player.name}
                                                            >
                                                                {player.name}
                                                            </span>
                                                            <Input
                                                                type="number"
                                                                value={player.kills}
                                                                onChange={(e) =>
                                                                    handleKillsChange(teamIndex, playerIndex, e.target.value)
                                                                }
                                                                className="mt-1 w-12 h-7 sm:h-8 text-xs text-center flex-shrink-0 px-0.5 self-end sm:mt-0"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <DialogFooter className="p-2 sm:p-3 border-t flex flex-col sm:flex-row gap-1.5 sm:gap-0 flex-shrink-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto text-xs sm:text-sm py-1.5 sm:py-2"
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isPending}
                        className="w-full sm:w-auto text-xs sm:text-sm py-1.5 sm:py-2"
                    >
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}