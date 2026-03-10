"use client";

import { useState, useRef } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button,
} from "@heroui/react";
import { Upload, Trophy, Camera, X, Plus, Minus } from "lucide-react";
import { Avatar } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

interface SubmitResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string | null;
    tournamentId?: string;
    // Player context — needed to submit scores in the correct order
    player1Id?: string | null;
    player1Name?: string | null;
    player1Avatar?: string | null;
    player2Name?: string | null;
    player2Avatar?: string | null;
    currentPlayerId?: string | null;
    isAdmin?: boolean;
    isDisputing?: boolean; // true when raising a dispute (opponent already submitted)
}

/* ─── Submit Result Modal ───────────────────────────────────── */

export function SubmitResultModal({
    isOpen, onClose, matchId, tournamentId,
    player1Id, player1Name, player1Avatar, player2Name, player2Avatar, currentPlayerId, isAdmin = false, isDisputing = false,
}: SubmitResultModalProps) {
    const isPlayer2 = !!currentPlayerId && currentPlayerId !== player1Id;

    const myName = isAdmin ? (player1Name ?? "Player 1") : "You";
    const oppName = isAdmin ? (player2Name ?? "Player 2") : (isPlayer2 ? (player1Name ?? "Opponent") : (player2Name ?? "Opponent"));
    const myAvatar = isAdmin || !isPlayer2 ? player1Avatar : player2Avatar;
    const oppAvatar = isAdmin || !isPlayer2 ? player2Avatar : player1Avatar;

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

            let screenshotUrl: string | null = null;
            if (screenshot) {
                try {
                    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
                    if (!apiKey) throw new Error("ImgBB API key not configured");
                    const formData = new FormData();
                    const compressed = await compressImage(screenshot);
                    formData.append("image", compressed);
                    formData.append("name", `bracket-${matchId}-${Date.now()}`);
                    const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
                    const uploadData = await uploadRes.json();
                    if (!uploadData.success) throw new Error(uploadData.error?.message || "ImgBB upload failed");
                    screenshotUrl = uploadData.data.url;
                } catch (err: unknown) {
                    throw new Error(`Screenshot upload failed: ${err instanceof Error ? err.message : String(err)}`);
                }
            }

            // score1 = player1's goals, score2 = player2's goals
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
                <ModalHeader className="flex items-center gap-2 pb-0">
                    <Trophy className="h-4 w-4 text-primary" />
                    {isDisputing ? "Submit Your Version" : "Submit Result"}
                </ModalHeader>

                <ModalBody className="gap-3 pt-2 pb-3">
                    <p className="text-[11px] text-foreground/40 text-center">
                        {isDisputing
                            ? <>Enter the score <strong className="text-foreground/60">as you saw it</strong> to raise a dispute.</>
                            : <>Opponent has <strong className="text-foreground/60">30 min</strong> to confirm or dispute.</>
                        }
                    </p>

                    {/* VS Score cards */}
                    <div className="flex items-stretch gap-2">
                        {/* My side — prominent */}
                        <div className="flex-1 flex flex-col items-center gap-2 rounded-2xl bg-primary/8 border border-primary/20 py-3 px-2">
                            <Avatar src={myAvatar || undefined} name={myName[0]?.toUpperCase() ?? "?"} size="sm"
                                classNames={{ base: "bg-primary/20", name: "text-primary font-bold" }} />
                            <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider truncate max-w-full px-1 text-center leading-none">
                                {myName}
                            </span>
                            <span className="text-5xl font-black tabular-nums text-primary leading-none select-none">{myScore}</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setMyScore(Math.max(0, myScore - 1))}
                                    className="h-8 w-8 rounded-full bg-primary/15 hover:bg-primary/25 active:scale-95 flex items-center justify-center transition-all">
                                    <Minus className="h-3.5 w-3.5 text-primary" />
                                </button>
                                <button type="button" onClick={() => setMyScore(myScore + 1)}
                                    className="h-8 w-8 rounded-full bg-primary/20 hover:bg-primary/30 active:scale-95 flex items-center justify-center transition-all">
                                    <Plus className="h-3.5 w-3.5 text-primary" />
                                </button>
                            </div>
                        </div>

                        {/* VS divider */}
                        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                            <div className="flex-1 w-px bg-divider" />
                            <span className="text-[10px] font-bold text-foreground/20 tracking-widest px-1">VS</span>
                            <div className="flex-1 w-px bg-divider" />
                        </div>

                        {/* Opponent side — muted */}
                        <div className="flex-1 flex flex-col items-center gap-2 rounded-2xl bg-default-100/60 border border-divider py-3 px-2">
                            <Avatar src={oppAvatar || undefined} name={oppName[0]?.toUpperCase() ?? "?"} size="sm"
                                classNames={{ base: "bg-default-200", name: "text-foreground/40 font-bold" }} />
                            <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider truncate max-w-full px-1 text-center leading-none">
                                {oppName}
                            </span>
                            <span className="text-5xl font-black tabular-nums text-foreground/40 leading-none select-none">{oppScore}</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setOppScore(Math.max(0, oppScore - 1))}
                                    className="h-8 w-8 rounded-full bg-default-200 hover:bg-default-300 active:scale-95 flex items-center justify-center transition-all">
                                    <Minus className="h-3.5 w-3.5 text-foreground/50" />
                                </button>
                                <button type="button" onClick={() => setOppScore(oppScore + 1)}
                                    className="h-8 w-8 rounded-full bg-default-200 hover:bg-default-300 active:scale-95 flex items-center justify-center transition-all">
                                    <Plus className="h-3.5 w-3.5 text-foreground/50" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Draw warning */}
                    {isDraw && (
                        <p className="text-[11px] text-danger text-center font-medium">
                            There must be a winner — scores can&apos;t be equal
                        </p>
                    )}

                    {/* Screenshot — compact */}
                    <div>
                        {previewUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-divider">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={previewUrl} alt="Score screenshot" className="w-full max-h-32 object-contain bg-black/50" />
                                <button onClick={removeScreenshot}
                                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => fileInputRef.current?.click()}
                                className="w-full rounded-xl border border-dashed border-foreground/12 hover:border-primary/40 bg-default-50/40 hover:bg-primary/4 transition-all flex items-center justify-center gap-2 py-2.5 text-foreground/40 hover:text-primary/60">
                                <Camera className="h-4 w-4" />
                                <span className="text-xs">Add screenshot <span className="text-foreground/25">(optional)</span></span>
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </div>
                </ModalBody>

                <ModalFooter className="pt-0 gap-2">
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
