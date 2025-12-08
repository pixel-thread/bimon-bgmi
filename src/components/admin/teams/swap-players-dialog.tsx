"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { TeamT } from "@/src/types/team";
import React from "react";
import { toast } from "sonner";
import { useTournamentStore } from "@/src/store/tournament";
import { useMatchStore } from "@/src/store/match/useMatchStore";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_TOURNAMENT_ENDPOINTS } from "@/src/lib/endpoints/admin/tournament";

type SwapPlayersDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const SwapPlayersDialog = ({
    open,
    onOpenChange,
}: SwapPlayersDialogProps) => {
    const queryClient = useQueryClient();
    const { tournamentId } = useTournamentStore();
    const { matchId } = useMatchStore();

    // Selection state
    const [teamAId, setTeamAId] = React.useState<string>("");
    const [playerAId, setPlayerAId] = React.useState<string>("");
    const [teamBId, setTeamBId] = React.useState<string>("");
    const [playerBId, setPlayerBId] = React.useState<string>("");

    // Fetch ALL teams for this tournament (always use match=all to get all teams)
    const allTeamsUrl = ADMIN_TOURNAMENT_ENDPOINTS.GET_TEAM_BY_TOURNAMENT_ID
        .replace(":id", tournamentId)
        .replace(":matchId", "all")
        .replace(":page", "all");

    const { data: teamsResponse, isLoading: isLoadingTeams } = useQuery({
        queryKey: ["teams", tournamentId, "all", "all", "swap-dialog"],
        queryFn: () => http.get<TeamT[]>(allTeamsUrl),
        enabled: open && !!tournamentId,
    });
    const teams = teamsResponse?.data || [];

    // Get selected teams
    const teamA = teams.find((t: TeamT) => t.id === teamAId);
    const teamB = teams.find((t: TeamT) => t.id === teamBId);

    // Swap mutation
    const { mutate: swapPlayers, isPending: isSwapping } = useMutation({
        mutationFn: () =>
            http.post(ADMIN_TEAM_ENDPOINTS.POST_SWAP_PLAYERS, {
                teamAId,
                playerAId,
                teamBId,
                playerBId,
                matchId,
            }),
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Players swapped successfully");
                queryClient.invalidateQueries({
                    queryKey: ["teams", tournamentId],
                });
                onOpenChange(false);
                // Reset selections
                setTeamAId("");
                setPlayerAId("");
                setTeamBId("");
                setPlayerBId("");
            } else {
                toast.error(data.message || "Failed to swap players");
            }
        },
        onError: () => {
            toast.error("Failed to swap players");
        },
    });

    // Reset player selection when team changes
    React.useEffect(() => {
        setPlayerAId("");
    }, [teamAId]);

    React.useEffect(() => {
        setPlayerBId("");
    }, [teamBId]);

    const canSwap = teamAId && playerAId && teamBId && playerBId && teamAId !== teamBId;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Swap Players
                    </DialogTitle>
                    <DialogDescription>
                        Select two players from different teams to swap their positions.
                        No UC will be deducted.
                    </DialogDescription>
                </DialogHeader>

                {isLoadingTeams ? (
                    <div className="py-10 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Team A Selection */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">From Team</h4>
                            <Select value={teamAId} onValueChange={setTeamAId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map((team: TeamT) => (
                                        <SelectItem key={team.id} value={team.id} disabled={team.id === teamBId}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {teamA && (
                                <Select value={playerAId} onValueChange={setPlayerAId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select player" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teamA.players?.map((player: { id: string; name: string }) => (
                                            <SelectItem key={player.id} value={player.id}>
                                                {player.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Swap Arrow */}
                        <div className="flex justify-center">
                            <div className="p-2 rounded-full bg-muted">
                                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Team B Selection */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">To Team</h4>
                            <Select value={teamBId} onValueChange={setTeamBId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map((team: TeamT) => (
                                        <SelectItem key={team.id} value={team.id} disabled={team.id === teamAId}>
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {teamB && (
                                <Select value={playerBId} onValueChange={setPlayerBId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select player" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teamB.players?.map((player: { id: string; name: string }) => (
                                            <SelectItem key={player.id} value={player.id}>
                                                {player.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Preview */}
                        {canSwap && teamA && teamB && (
                            <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                <p className="font-medium mb-2">Preview:</p>
                                <p>
                                    <span className="text-primary">{teamA.players?.find((p: { id: string; name: string }) => p.id === playerAId)?.name}</span>
                                    {" → "}
                                    <span className="text-muted-foreground">{teamB.name}</span>
                                </p>
                                <p>
                                    <span className="text-primary">{teamB.players?.find((p: { id: string; name: string }) => p.id === playerBId)?.name}</span>
                                    {" → "}
                                    <span className="text-muted-foreground">{teamA.name}</span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSwapping}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => swapPlayers()}
                        disabled={!canSwap || isSwapping}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSwapping ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Swapping...
                            </>
                        ) : (
                            <>
                                <ArrowLeftRight className="mr-2 h-4 w-4" />
                                Swap Players
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
