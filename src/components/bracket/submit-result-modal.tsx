"use client";

import { useState } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input,
} from "@heroui/react";
import { Upload, Trophy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubmitResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string | null;
    tournamentId: string;
}

export function SubmitResultModal({ isOpen, onClose, matchId, tournamentId }: SubmitResultModalProps) {
    const [score1, setScore1] = useState("");
    const [score2, setScore2] = useState("");
    const queryClient = useQueryClient();

    const submitResult = useMutation({
        mutationFn: async () => {
            if (!matchId) throw new Error("No match selected");
            const s1 = parseInt(score1);
            const s2 = parseInt(score2);
            if (isNaN(s1) || isNaN(s2)) throw new Error("Enter valid scores");
            if (s1 === s2) throw new Error("Draws not allowed — there must be a winner");

            const res = await fetch(`/api/bracket-matches/${matchId}/submit-result`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score1: s1, score2: s2 }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Result submitted!");
            queryClient.invalidateQueries({ queryKey: ["bracket", tournamentId] });
            onClose();
            setScore1("");
            setScore2("");
        },
        onError: (err: Error) => toast.error(err.message),
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} placement="center">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Submit Match Result
                </ModalHeader>
                <ModalBody className="gap-4">
                    <p className="text-sm text-foreground/60">
                        Enter the final score. Your opponent will have 30 minutes to confirm or dispute.
                    </p>
                    <div className="flex items-center gap-3">
                        <Input
                            label="Your Score"
                            type="number"
                            min="0"
                            value={score1}
                            onValueChange={setScore1}
                            size="lg"
                            className="flex-1"
                            classNames={{ input: "text-center text-2xl font-bold" }}
                        />
                        <span className="text-foreground/30 font-bold text-lg">—</span>
                        <Input
                            label="Opponent"
                            type="number"
                            min="0"
                            value={score2}
                            onValueChange={setScore2}
                            size="lg"
                            className="flex-1"
                            classNames={{ input: "text-center text-2xl font-bold" }}
                        />
                    </div>
                    <p className="text-[11px] text-foreground/40 text-center">
                        Player 1 score — Player 2 score (in bracket order)
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>Cancel</Button>
                    <Button
                        color="primary"
                        isLoading={submitResult.isPending}
                        isDisabled={!score1 || !score2 || score1 === score2}
                        onPress={() => submitResult.mutate()}
                    >
                        Submit Result
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

/* ─── Confirm Result ────────────────────────────────────────── */

export function useConfirmResult(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (matchId: string) => {
            const res = await fetch(`/api/bracket-matches/${matchId}/submit-result`, {
                method: "PUT",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to confirm");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Result confirmed!");
            queryClient.invalidateQueries({ queryKey: ["bracket", tournamentId] });
        },
        onError: (err: Error) => toast.error(err.message),
    });
}

/* ─── Dispute Result ────────────────────────────────────────── */

export function useDisputeResult(tournamentId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (matchId: string) => {
            const res = await fetch(`/api/bracket-matches/${matchId}/dispute`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to dispute");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Dispute submitted!");
            queryClient.invalidateQueries({ queryKey: ["bracket", tournamentId] });
        },
        onError: (err: Error) => toast.error(err.message),
    });
}
