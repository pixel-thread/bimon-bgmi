"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Select,
    SelectItem,
    Avatar,
    Spinner,
} from "@heroui/react";
import { ArrowLeftRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TeamDTO {
    id: string;
    name: string;
    teamNumber: number;
    players: {
        id: string;
        displayName: string | null;
        username: string;
        imageUrl: string | null;
    }[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    teams: TeamDTO[];
}

/**
 * Modal for swapping two players between two teams.
 */
export function SwapPlayersModal({ isOpen, onClose, tournamentId, teams }: Props) {
    const [teamAId, setTeamAId] = useState("");
    const [playerAId, setPlayerAId] = useState("");
    const [teamBId, setTeamBId] = useState("");
    const [playerBId, setPlayerBId] = useState("");
    const queryClient = useQueryClient();

    const teamA = useMemo(() => teams.find((t) => t.id === teamAId), [teams, teamAId]);
    const teamB = useMemo(() => teams.find((t) => t.id === teamBId), [teams, teamBId]);

    // Only show teams that are different from the other selection
    const teamsForA = useMemo(() => teams.filter((t) => t.id !== teamBId), [teams, teamBId]);
    const teamsForB = useMemo(() => teams.filter((t) => t.id !== teamAId), [teams, teamAId]);

    const { mutate: swapPlayers, isPending } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/teams/swap-players", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamAId, playerAId, teamBId, playerBId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to swap");
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Players swapped");
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    function handleClose() {
        setTeamAId("");
        setPlayerAId("");
        setTeamBId("");
        setPlayerBId("");
        onClose();
    }

    const canSwap = teamAId && playerAId && teamBId && playerBId;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5" />
                    Swap Players
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Team A */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-foreground/50">FROM</p>
                            <Select
                                label="Team"
                                size="sm"
                                selectedKeys={teamAId ? [teamAId] : []}
                                onSelectionChange={(keys) => {
                                    const val = Array.from(keys)[0] as string;
                                    setTeamAId(val || "");
                                    setPlayerAId("");
                                }}
                            >
                                {teamsForA.map((t) => (
                                    <SelectItem key={t.id}>
                                        #{t.teamNumber} {t.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            {teamA && (
                                <div className="space-y-1">
                                    {teamA.players.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPlayerAId(p.id)}
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${playerAId === p.id
                                                ? "bg-primary/10 ring-1 ring-primary"
                                                : "hover:bg-default-100"
                                                }`}
                                        >
                                            <Avatar
                                                src={p.imageUrl || undefined}
                                                name={p.displayName || p.username}
                                                size="sm"
                                                className="h-6 w-6"
                                            />
                                            <span className="truncate">
                                                {p.displayName || p.username}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Team B */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-foreground/50">TO</p>
                            <Select
                                label="Team"
                                size="sm"
                                selectedKeys={teamBId ? [teamBId] : []}
                                onSelectionChange={(keys) => {
                                    const val = Array.from(keys)[0] as string;
                                    setTeamBId(val || "");
                                    setPlayerBId("");
                                }}
                            >
                                {teamsForB.map((t) => (
                                    <SelectItem key={t.id}>
                                        #{t.teamNumber} {t.name}
                                    </SelectItem>
                                ))}
                            </Select>
                            {teamB && (
                                <div className="space-y-1">
                                    {teamB.players.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPlayerBId(p.id)}
                                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${playerBId === p.id
                                                ? "bg-primary/10 ring-1 ring-primary"
                                                : "hover:bg-default-100"
                                                }`}
                                        >
                                            <Avatar
                                                src={p.imageUrl || undefined}
                                                name={p.displayName || p.username}
                                                size="sm"
                                                className="h-6 w-6"
                                            />
                                            <span className="truncate">
                                                {p.displayName || p.username}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {canSwap && (
                        <div className="mt-2 rounded-lg bg-default-100 p-3 text-center text-sm">
                            <span className="font-medium">
                                {teamA?.players.find((p) => p.id === playerAId)?.displayName}
                            </span>
                            <ArrowLeftRight className="mx-2 inline h-4 w-4 text-primary" />
                            <span className="font-medium">
                                {teamB?.players.find((p) => p.id === playerBId)?.displayName}
                            </span>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={handleClose} size="sm">
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={() => swapPlayers()}
                        isLoading={isPending}
                        isDisabled={!canSwap}
                        size="sm"
                    >
                        Swap Players
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
