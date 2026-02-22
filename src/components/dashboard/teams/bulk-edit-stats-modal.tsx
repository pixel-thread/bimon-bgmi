"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Spinner,
    Tabs,
    Tab,
} from "@heroui/react";
import { Pencil, Wand2 } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MatchTeam {
    teamId: string;
    teamName: string;
    teamNumber: number;
    position: number;
    players: {
        id: string;
        displayName: string | null;
        username: string;
        imageUrl: string | null;
        kills: number;
        present: boolean;
    }[];
}

interface MatchData {
    id: string;
    matchNumber: number;
    teams: MatchTeam[];
}

interface EditableTeam {
    teamId: string;
    teamName: string;
    teamNumber: number;
    position: string;
    players: {
        playerId: string;
        name: string;
        kills: string;
        present: boolean;
    }[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    tournamentId: string;
    /** Pass a specific match ID, or "all" for tournament-wide editing */
    matchId: string;
    /** Per-tournament match numbers for tab labels */
    matches?: { id: string; matchNumber: number }[];
}

/**
 * Modal for editing team stats.
 * - Single match: edit position + kills for that match
 * - All matches: tabs for each match, edit independently
 * Supports AI JSON paste to auto-fill kills.
 */
export function BulkEditStatsModal({
    isOpen,
    onClose,
    tournamentId,
    matchId,
    matches = [],
}: Props) {
    const isAllMode = matchId === "all";
    const [activeTab, setActiveTab] = useState("");
    const [editableData, setEditableData] = useState<Record<string, EditableTeam[]>>({});
    const [aiJson, setAiJson] = useState("");
    const [showAiInput, setShowAiInput] = useState(false);
    const queryClient = useQueryClient();

    // Fetch all match data for the tournament
    const { data: allMatches, isLoading } = useQuery<MatchData[]>({
        queryKey: ["match-stats", tournamentId],
        queryFn: async () => {
            const res = await fetch(`/api/matches?tournamentId=${tournamentId}`);
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data ?? [];
        },
        enabled: isOpen && !!tournamentId,
    });

    // Filter to relevant matches
    const relevantMatches = useMemo(() => {
        if (!allMatches) return [];
        if (isAllMode) return allMatches;
        return allMatches.filter((m) => m.id === matchId);
    }, [allMatches, matchId, isAllMode]);

    // Initialize editable state
    useEffect(() => {
        if (relevantMatches.length > 0) {
            const data: Record<string, EditableTeam[]> = {};
            for (const match of relevantMatches) {
                data[match.id] = match.teams.map((t) => ({
                    teamId: t.teamId,
                    teamName: t.teamName,
                    teamNumber: t.teamNumber,
                    position: String(t.position || ""),
                    players: t.players.map((p) => ({
                        playerId: p.id,
                        name: p.displayName || p.username,
                        kills: String(p.kills || 0),
                        present: p.present,
                    })),
                }));
            }
            setEditableData(data);

            // Set active tab
            if (!activeTab || !data[activeTab]) {
                if (isAllMode && relevantMatches.length > 0) {
                    setActiveTab(relevantMatches[0].id);
                } else if (!isAllMode) {
                    setActiveTab(matchId);
                }
            }
        }
    }, [relevantMatches, isAllMode, matchId]);

    // Current tab's teams
    const currentTeams = editableData[activeTab] ?? [];

    // Per-tournament match number for display
    const getMatchLabel = useCallback((mId: string) => {
        const m = matches.find((x) => x.id === mId);
        return m ? `Match ${m.matchNumber}` : "Match";
    }, [matches]);

    // Handlers
    const setPosition = useCallback((mId: string, teamIdx: number, value: string) => {
        setEditableData((prev) => {
            const next = { ...prev };
            const teams = [...(next[mId] ?? [])];
            teams[teamIdx] = { ...teams[teamIdx], position: value };
            next[mId] = teams;
            return next;
        });
    }, []);

    const setKills = useCallback((mId: string, teamIdx: number, playerIdx: number, value: string) => {
        setEditableData((prev) => {
            const next = { ...prev };
            const teams = [...(next[mId] ?? [])];
            const team = { ...teams[teamIdx] };
            const players = [...team.players];
            players[playerIdx] = { ...players[playerIdx], kills: value };
            team.players = players;
            teams[teamIdx] = team;
            next[mId] = teams;
            return next;
        });
    }, []);

    const togglePresent = useCallback((mId: string, teamIdx: number, playerIdx: number) => {
        setEditableData((prev) => {
            const next = { ...prev };
            const teams = [...(next[mId] ?? [])];
            const team = { ...teams[teamIdx] };
            const players = [...team.players];
            const p = { ...players[playerIdx] };
            p.present = !p.present;
            if (!p.present) p.kills = "0";
            players[playerIdx] = p;
            team.players = players;
            teams[teamIdx] = team;
            next[mId] = teams;
            return next;
        });
    }, []);

    // AI JSON paste
    function applyAiJson() {
        try {
            const parsed = JSON.parse(aiJson);
            const items = Array.isArray(parsed) ? parsed : parsed.players || [];
            const teams = editableData[activeTab] ?? [];

            // Build player name map
            const playerNameMap = new Map<string, { teamIdx: number; playerIdx: number }>();
            teams.forEach((team, ti) => {
                team.players.forEach((p, pi) => {
                    playerNameMap.set(p.name.toLowerCase().replace(/\s+/g, " ").trim(), { teamIdx: ti, playerIdx: pi });
                });
            });

            let matched = 0;
            const next = { ...editableData };
            const updatedTeams = [...teams];

            for (const item of items) {
                const name = (item.name || "").toLowerCase().replace(/\s+/g, " ").trim();
                const loc = playerNameMap.get(name);
                if (loc) {
                    const team = { ...updatedTeams[loc.teamIdx] };
                    const players = [...team.players];
                    players[loc.playerIdx] = { ...players[loc.playerIdx], kills: String(item.kills ?? 0), present: true };
                    team.players = players;
                    updatedTeams[loc.teamIdx] = team;
                    matched++;
                }
            }

            next[activeTab] = updatedTeams;
            setEditableData(next);
            setShowAiInput(false);
            setAiJson("");
            toast.success(`Matched ${matched} / ${items.length} players`);
        } catch {
            toast.error("Invalid JSON format");
        }
    }

    // Save — sends stats for all edited matches
    const { mutate: saveStats, isPending } = useMutation({
        mutationFn: async () => {
            const matchIds = Object.keys(editableData);
            const promises = matchIds.map((mId) => {
                const stats = (editableData[mId] ?? []).map((t) => ({
                    teamId: t.teamId,
                    position: parseInt(t.position) || 0,
                    players: t.players.map((p) => ({
                        playerId: p.playerId,
                        kills: parseInt(p.kills) || 0,
                        present: p.present,
                    })),
                }));

                return fetch("/api/teams/bulk-stats", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tournamentId, matchId: mId, stats }),
                }).then(async (res) => {
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.message || "Failed");
                    return json;
                });
            });

            await Promise.all(promises);
        },
        onSuccess: () => {
            toast.success("Stats saved for all matches");
            queryClient.invalidateQueries({ queryKey: ["teams"] });
            queryClient.invalidateQueries({ queryKey: ["matches"] });
            queryClient.invalidateQueries({ queryKey: ["match-stats"] });
            onClose();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

    // Render team editor for a given match
    function renderTeamEditor(mId: string) {
        const teams = editableData[mId] ?? [];
        return (
            <div className="space-y-4">
                {teams.map((team, ti) => (
                    <div key={team.teamId} className="rounded-lg border border-divider p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {team.teamNumber}
                                </span>
                                <span className="text-sm font-semibold">{team.teamName}</span>
                            </div>
                            <Input
                                label="Pos"
                                size="sm"
                                type="number"
                                value={team.position}
                                onValueChange={(v) => setPosition(mId, ti, v)}
                                onFocus={handleFocus}
                                className="w-20"
                                classNames={{ inputWrapper: "h-8" }}
                            />
                        </div>
                        <div className="space-y-1">
                            {team.players.map((p, pi) => (
                                <div
                                    key={p.playerId}
                                    className={`flex items-center gap-2 rounded-md px-2 py-1 ${!p.present ? "opacity-40" : ""}`}
                                >
                                    <button
                                        onClick={() => togglePresent(mId, ti, pi)}
                                        className={`text-xs truncate flex-1 text-left ${!p.present ? "line-through" : ""}`}
                                        title="Click to toggle absent/present"
                                    >
                                        {p.name}
                                    </button>
                                    <Input
                                        size="sm"
                                        type="number"
                                        value={p.kills}
                                        onValueChange={(v) => setKills(mId, ti, pi, v)}
                                        onFocus={handleFocus}
                                        isDisabled={!p.present}
                                        className="w-16"
                                        classNames={{ inputWrapper: "h-7" }}
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalContent>
                <ModalHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        <span>
                            Edit Stats{isAllMode ? " — All Matches" : ` — ${getMatchLabel(matchId)}`}
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Wand2 className="h-3.5 w-3.5" />}
                        onPress={() => setShowAiInput(!showAiInput)}
                    >
                        AI Fill
                    </Button>
                </ModalHeader>
                <ModalBody>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner />
                        </div>
                    ) : (
                        <>
                            {/* AI JSON input */}
                            {showAiInput && (
                                <div className="space-y-2 rounded-lg bg-default-100 p-3">
                                    <p className="text-xs text-foreground/50">
                                        Paste AI-extracted JSON (format: {"[{name, kills}]"})
                                    </p>
                                    <Textarea
                                        value={aiJson}
                                        onValueChange={setAiJson}
                                        placeholder='[{"name":"player1","kills":5},...]'
                                        minRows={3}
                                        maxRows={6}
                                        size="sm"
                                    />
                                    <Button size="sm" color="secondary" onPress={applyAiJson} isDisabled={!aiJson.trim()}>
                                        Apply to {getMatchLabel(activeTab)}
                                    </Button>
                                </div>
                            )}

                            {/* Tabs for all-matches mode */}
                            {isAllMode && relevantMatches.length > 1 ? (
                                <Tabs
                                    selectedKey={activeTab}
                                    onSelectionChange={(key) => setActiveTab(String(key))}
                                    size="sm"
                                    variant="underlined"
                                    classNames={{ tabList: "gap-0" }}
                                >
                                    {relevantMatches.map((m) => (
                                        <Tab key={m.id} title={getMatchLabel(m.id)}>
                                            {renderTeamEditor(m.id)}
                                        </Tab>
                                    ))}
                                </Tabs>
                            ) : (
                                renderTeamEditor(activeTab)
                            )}
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose} size="sm">
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={() => saveStats()}
                        isLoading={isPending}
                        isDisabled={Object.keys(editableData).length === 0}
                        size="sm"
                    >
                        Save {isAllMode ? "All" : "Stats"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
