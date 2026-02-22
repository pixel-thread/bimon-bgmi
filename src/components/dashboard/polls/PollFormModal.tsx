"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Switch,
} from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Vote, Loader2 } from "lucide-react";

interface PollDTO {
    id: string;
    question: string;
    days: string;
    teamType: string;
    isActive: boolean;
    tournament?: { id: string; name: string; fee: number };
}

interface TournamentOption {
    id: string;
    name: string;
    fee: number;
}

const TEAM_TYPES = ["SOLO", "DUO", "TRIO", "SQUAD", "DYNAMIC"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface PollFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    poll?: PollDTO | null; // null = create, object = edit
    onSaved: () => void;
}

export function PollFormModal({ isOpen, onClose, poll, onSaved }: PollFormModalProps) {
    const isEdit = !!poll;

    const [question, setQuestion] = useState("");
    const [days, setDays] = useState("Monday");
    const [teamType, setTeamType] = useState("DUO");
    const [tournamentId, setTournamentId] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load tournaments for select
    const { data: tournaments } = useQuery<TournamentOption[]>({
        queryKey: ["tournaments-for-poll"],
        queryFn: async () => {
            const res = await fetch("/api/tournaments");
            if (!res.ok) throw new Error("Failed");
            const json = await res.json();
            return json.data?.map((t: any) => ({ id: t.id, name: t.name, fee: t.fee ?? 0 })) ?? [];
        },
        enabled: isOpen,
    });

    // Reset form when poll changes
    useEffect(() => {
        if (poll) {
            setQuestion(poll.question);
            setDays(poll.days);
            setTeamType(poll.teamType);
            setTournamentId(poll.tournament?.id ?? "");
            setIsActive(poll.isActive);
        } else {
            setQuestion("");
            setDays("Monday");
            setTeamType("DUO");
            setTournamentId("");
            setIsActive(true);
        }
    }, [poll, isOpen]);

    // Auto-select latest tournament for new polls
    useEffect(() => {
        if (!isEdit && tournaments && tournaments.length > 0 && !tournamentId) {
            const latest = tournaments[0];
            setTournamentId(latest.id);
            setQuestion(latest.name);
        }
    }, [tournaments, isEdit, tournamentId]);

    const handleSave = useCallback(async () => {
        if (!question.trim()) {
            toast.error("Question is required");
            return;
        }
        if (!isEdit && !tournamentId) {
            toast.error("Select a tournament");
            return;
        }

        setSaving(true);
        try {
            const body = isEdit
                ? { id: poll!.id, question, days, teamType, isActive }
                : { question, days, teamType, tournamentId };

            const res = await fetch("/api/polls", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.message || "Failed");

            toast.success(isEdit ? "Poll updated" : "Poll created");
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }, [isEdit, poll, question, days, teamType, tournamentId, isActive, onSaved, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" placement="center">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 text-base">
                    <Vote className="h-4 w-4" />
                    {isEdit ? "Edit Poll" : "New Poll"}
                </ModalHeader>

                <ModalBody className="space-y-4">
                    {/* Tournament select (only for create) */}
                    {!isEdit && (
                        <Select
                            label="Tournament"
                            placeholder="Select tournament"
                            selectedKeys={tournamentId ? [tournamentId] : []}
                            onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0] as string;
                                if (key) {
                                    setTournamentId(key);
                                    const t = tournaments?.find((t) => t.id === key);
                                    if (t) setQuestion(t.name);
                                }
                            }}
                            size="sm"
                            isRequired
                            items={tournaments ?? []}
                        >
                            {(t) => (
                                <SelectItem key={t.id} textValue={`${t.name}${t.fee > 0 ? ` (${t.fee} UC)` : ""}`}>
                                    {t.name}{t.fee > 0 ? ` (${t.fee} UC)` : ""}
                                </SelectItem>
                            )}
                        </Select>
                    )}

                    {isEdit && poll?.tournament && (
                        <div className="rounded-lg bg-default-100 px-3 py-2 text-sm">
                            <span className="text-foreground/50">Tournament: </span>
                            <span className="font-medium">{poll.tournament.name}</span>
                        </div>
                    )}

                    <Input
                        label="Question"
                        value={question}
                        onValueChange={setQuestion}
                        size="sm"
                        isRequired
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Team Type"
                            selectedKeys={[teamType]}
                            onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0] as string;
                                if (key) setTeamType(key);
                            }}
                            size="sm"
                        >
                            {TEAM_TYPES.map((t) => (
                                <SelectItem key={t} textValue={t}>{t}</SelectItem>
                            ))}
                        </Select>

                        <Select
                            label="Day"
                            selectedKeys={[days]}
                            onSelectionChange={(keys) => {
                                const key = Array.from(keys)[0] as string;
                                if (key) setDays(key);
                            }}
                            size="sm"
                        >
                            {DAYS.map((d) => (
                                <SelectItem key={d} textValue={d}>{d}</SelectItem>
                            ))}
                        </Select>
                    </div>

                    {isEdit && (
                        <div className="flex items-center justify-between rounded-lg bg-default-100 px-3 py-2">
                            <span className="text-sm">Active</span>
                            <Switch
                                size="sm"
                                isSelected={isActive}
                                onValueChange={setIsActive}
                            />
                        </div>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button variant="flat" onPress={onClose} isDisabled={saving} size="sm">
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSave}
                        isDisabled={saving}
                        size="sm"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                Saving...
                            </>
                        ) : isEdit ? (
                            "Update"
                        ) : (
                            "Create"
                        )}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
