"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Avatar,
    Chip,
    Checkbox,
    Spinner,
} from "@heroui/react";
import { Search, Plus, X, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Player {
    id: string;
    displayName: string | null;
    username: string;
    imageUrl: string | null;
    category: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    matchId: string;
    /** Existing player IDs already on teams for this tournament */
    existingPlayerIds?: string[];
}

/**
 * Modal for creating a new team in a tournament match.
 * Search + select players, optional UC deduction, then create.
 */
export function CreateTeamModal({
    isOpen,
    onClose,
    tournamentId,
    matchId,
    existingPlayerIds = [],
}: Props) {
    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [deductUC, setDeductUC] = useState(false);
    const queryClient = useQueryClient();

    // Search players
    const { data: searchResults = [], isFetching } = useQuery<Player[]>({
        queryKey: ["player-search", search],
        queryFn: async () => {
            if (!search || search.length < 2) return [];
            const res = await fetch(`/api/players?search=${encodeURIComponent(search)}&limit=10`);
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data ?? []).map((p: Record<string, unknown>) => ({
                id: p.id,
                displayName: p.displayName,
                username: p.username,
                imageUrl: p.imageUrl,
                category: p.category,
            }));
        },
        enabled: search.length >= 2,
        staleTime: 10_000,
    });

    const availablePlayers = useMemo(
        () => searchResults.filter(
            (p) => !selectedIds.includes(p.id) && !existingPlayerIds.includes(p.id)
        ),
        [searchResults, selectedIds, existingPlayerIds]
    );

    // Track selected player details for display
    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

    function selectPlayer(player: Player) {
        setSelectedIds((prev) => [...prev, player.id]);
        setSelectedPlayers((prev) => [...prev, player]);
    }

    function removePlayer(id: string) {
        setSelectedIds((prev) => prev.filter((pid) => pid !== id));
        setSelectedPlayers((prev) => prev.filter((p) => p.id !== id));
    }

    // Create team mutation
    const { mutate: createTeam, isPending } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/teams/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tournamentId, matchId, playerIds: selectedIds, deductUC }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed to create team");
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Team created");
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            queryClient.invalidateQueries({ queryKey: ["matches"] });
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    function handleClose() {
        setSearch("");
        setSelectedIds([]);
        setSelectedPlayers([]);
        setDeductUC(false);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Create Team
                </ModalHeader>
                <ModalBody>
                    {/* Selected players */}
                    {selectedPlayers.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-foreground/50">
                                Selected ({selectedPlayers.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {selectedPlayers.map((p) => (
                                    <Chip
                                        key={p.id}
                                        onClose={() => removePlayer(p.id)}
                                        variant="flat"
                                        avatar={
                                            <Avatar
                                                src={p.imageUrl || undefined}
                                                name={p.displayName || p.username}
                                                size="sm"
                                            />
                                        }
                                    >
                                        {p.displayName || p.username}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <Input
                        placeholder="Search players by name..."
                        value={search}
                        onValueChange={setSearch}
                        startContent={<Search className="h-4 w-4 text-default-400" />}
                        size="sm"
                        isClearable
                        onClear={() => setSearch("")}
                        autoFocus
                    />

                    {/* Search results */}
                    {isFetching && (
                        <div className="flex justify-center py-4">
                            <Spinner size="sm" />
                        </div>
                    )}

                    {!isFetching && availablePlayers.length > 0 && (
                        <div className="max-h-48 space-y-1 overflow-y-auto">
                            {availablePlayers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => selectPlayer(p)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-default-100"
                                >
                                    <Avatar
                                        src={p.imageUrl || undefined}
                                        name={p.displayName || p.username}
                                        size="sm"
                                        className="h-8 w-8"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {p.displayName || p.username}
                                        </p>
                                        <p className="text-xs text-foreground/40">
                                            @{p.username}
                                        </p>
                                    </div>
                                    <Chip size="sm" variant="flat" className="text-[10px]">
                                        {p.category.replace("_", " ")}
                                    </Chip>
                                    <Plus className="h-4 w-4 text-foreground/30" />
                                </button>
                            ))}
                        </div>
                    )}

                    {search.length >= 2 && !isFetching && availablePlayers.length === 0 && (
                        <p className="py-4 text-center text-sm text-foreground/40">
                            No available players found
                        </p>
                    )}

                    {/* UC deduction toggle */}
                    <div className="pt-2">
                        <Checkbox
                            isSelected={deductUC}
                            onValueChange={setDeductUC}
                            size="sm"
                        >
                            <span className="text-sm">Deduct UC entry fee from players</span>
                        </Checkbox>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={handleClose} size="sm">
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={() => createTeam()}
                        isLoading={isPending}
                        isDisabled={selectedIds.length === 0}
                        size="sm"
                    >
                        Create Team ({selectedIds.length} players)
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
