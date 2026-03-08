"use client";

import { useState, useRef } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button,
} from "@heroui/react";
import { Upload, Trophy, Camera, X, Plus, Minus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubmitResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string | null;
    tournamentId?: string;
    // Player context — needed to submit scores in the correct order
    player1Id?: string | null;
    player1Name?: string | null;
    player2Name?: string | null;
    currentPlayerId?: string | null;
    isAdmin?: boolean;
    isDisputing?: boolean; // true when raising a dispute (opponent already submitted)
}

/* ─── Score Stepper ─────────────────────────────────────────── */

function ScoreStepper({ label, value, onChange }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(0, value - 1))}
                    className="h-9 w-9 rounded-full bg-default-100 hover:bg-default-200 active:scale-95 flex items-center justify-center transition-all"
                >
                    <Minus className="h-4 w-4 text-foreground/60" />
                </button>
                <span className="text-4xl font-black tabular-nums w-12 text-center select-none">{value}</span>
                <button
                    type="button"
                    onClick={() => onChange(value + 1)}
                    className="h-9 w-9 rounded-full bg-primary/15 hover:bg-primary/25 active:scale-95 flex items-center justify-center transition-all"
                >
                    <Plus className="h-4 w-4 text-primary" />
                </button>
            </div>
        </div>
    );
}

/* ─── Submit Result Modal ───────────────────────────────────── */

export function SubmitResultModal({
    isOpen, onClose, matchId, tournamentId,
    player1Id, player1Name, player2Name, currentPlayerId, isAdmin = false, isDisputing = false,
}: SubmitResultModalProps) {
    // Determine if current user is player2 (scores need to be swapped before sending)
    const isPlayer2 = !!currentPlayerId && currentPlayerId !== player1Id;

    // Labels: admin sees actual names; players see "My Goals" / "Opponent"
    const myLabel = isAdmin
        ? (player1Name ?? "Player 1")
        : "My Goals";
    const opponentLabel = isAdmin
        ? (player2Name ?? "Player 2")
        : "Opponent";

    // myScore = what this UI calls "mine", oppScore = opponent's
    const [myScore, setMyScore] = useState(0);
    const [oppScore, setOppScore] = useState(0);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const isDraw = myScore === oppScore;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
        setScreenshot(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const removeScreenshot = () => {
        setScreenshot(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleClose = () => {
        removeScreenshot();
        setMyScore(0);
        setOppScore(0);
        onClose();
    };

    const submitResult = useMutation({
        mutationFn: async () => {
            if (!matchId) throw new Error("No match selected");
            if (isDraw) throw new Error("Draws not allowed — there must be a winner");

            setUploading(true);

            // Upload screenshot to ImgBB if provided (free, no storage cost)
            let screenshotUrl: string | null = null;
            if (screenshot) {
                try {
                    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
                    if (!apiKey) throw new Error("ImgBB API key not configured");
                    const formData = new FormData();
                    formData.append("image", screenshot);
                    formData.append("name", `bracket-${matchId}-${Date.now()}`);
                    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                        method: "POST",
                        body: formData,
                    });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) throw new Error(uploadData.error?.message || "ImgBB upload failed");
                    screenshotUrl = uploadData.data.url;
                } catch (err: any) {
                    throw new Error(`Screenshot upload failed: ${err.message}`);
                }
            }

            // Build score1/score2 correctly for the API:
            // score1 = player1's goals, score2 = player2's goals
            // If admin: myScore IS score1 (admin sees player1 label first)
            // If player1: myScore IS score1 ✓
            // If player2: myScore IS score2, oppScore IS score1 → swap
            const finalScore1 = isAdmin || !isPlayer2 ? myScore : oppScore;
            const finalScore2 = isAdmin || !isPlayer2 ? oppScore : myScore;

            const res = await fetch(`/api/bracket-matches/${matchId}/submit-result`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score1: finalScore1, score2: finalScore2, screenshotUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Result submitted!");
            if (tournamentId) queryClient.invalidateQueries({ queryKey: ["bracket", tournamentId] });
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
        onSettled: () => setUploading(false),
    });

    return (
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="sm">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 pb-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    {isDisputing ? "Submit Your Version" : "Submit Result"}
                </ModalHeader>

                <ModalBody className="gap-4 py-4">
                    <p className="text-xs text-foreground/50 text-center">
                        {isDisputing
                            ? <>Enter the score <strong className="text-foreground/70">as you saw it</strong>. This will raise a dispute for admin review.</>
                            : <>Your opponent has <strong className="text-foreground/70">30 minutes</strong> to confirm or dispute.</>}
                    </p>

                    {/* Score steppers */}
                    <div className="flex items-center gap-2 py-2">
                        <ScoreStepper label={myLabel} value={myScore} onChange={setMyScore} />
                        <span className="text-2xl font-light text-foreground/20 mb-1">—</span>
                        <ScoreStepper label={opponentLabel} value={oppScore} onChange={setOppScore} />
                    </div>

                    {/* Screenshot — optional */}
                    <div className="space-y-1.5">
                        {previewUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-divider">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Score screenshot" className="w-full max-h-36 object-contain bg-black/50" />
                                <button
                                    onClick={removeScreenshot}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full rounded-2xl border-2 border-dashed border-foreground/15 hover:border-primary/40 bg-default-50/30 hover:bg-primary/5 transition-all group p-6 flex flex-col items-center gap-3"
                            >
                                {/* Image icon */}
                                <div className="p-3 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                    <Camera className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className="text-sm font-semibold text-foreground/60 group-hover:text-foreground/80 transition-colors">
                                        Tap to upload, <span className="text-primary">browse</span>
                                    </p>
                                    <p className="text-[11px] text-foreground/30">
                                        JPG, PNG · Max 5MB · Optional
                                    </p>
                                </div>
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </div>

                </ModalBody>

                <ModalFooter className="pt-0">
                    <Button variant="flat" onPress={handleClose} size="sm">Cancel</Button>
                    <Button
                        color="primary"
                        size="sm"
                        isLoading={submitResult.isPending || uploading}
                        isDisabled={isDraw}
                        onPress={() => submitResult.mutate()}
                        startContent={!submitResult.isPending && !uploading ? <Upload className="h-3.5 w-3.5" /> : undefined}
                    >
                        {uploading ? "Uploading..." : "Submit"}
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
            const res = await fetch(`/api/bracket-matches/${matchId}/submit-result`, { method: "PUT" });
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
