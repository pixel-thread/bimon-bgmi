"use client";

import { useState, useRef } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button,
} from "@heroui/react";
import { Upload, Trophy, Camera, X, Plus, Minus, MessageSquare, UserX, ArrowLeftRight } from "lucide-react";
import { Avatar } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadToCloudinary } from "@/lib/upload-to-cloudinary";


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
    isEditing?: boolean; // true when re-editing own submitted result
    drawsAllowed?: boolean; // true for group stage / league matches
}

/* ─── Submit Result Modal ───────────────────────────────────── */

export function SubmitResultModal({
    isOpen, onClose, matchId, tournamentId,
    player1Id, player1Name, player1Avatar, player2Name, player2Avatar, currentPlayerId, isAdmin = false, isDisputing = false, isEditing = false, drawsAllowed = false,
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
    const [notes, setNotes] = useState("");
    const [swapped, setSwapped] = useState(false);

    // Display names/avatars based on swap state
    const leftName = swapped ? oppName : myName;
    const leftAvatar = swapped ? oppAvatar : myAvatar;
    const leftScore = swapped ? oppScore : myScore;
    const setLeftScore = swapped ? setOppScore : setMyScore;
    const rightName = swapped ? myName : oppName;
    const rightAvatar = swapped ? myAvatar : oppAvatar;
    const rightScore = swapped ? myScore : oppScore;
    const setRightScore = swapped ? setMyScore : setOppScore;
    const leftIsPrimary = !swapped;
    const [showNotes, setShowNotes] = useState(false);
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
        setNotes("");
        setShowNotes(false);
        onClose();
    };

    const submitResult = useMutation({
        mutationFn: async () => {
            if (!matchId) throw new Error("No match selected");
            if (isDraw && !drawsAllowed) throw new Error("Draws not allowed — there must be a winner");

            setUploading(true);

            let screenshotUrl: string | null = null;
            if (screenshot) {
                try {
                    screenshotUrl = await uploadToCloudinary(screenshot, matchId);
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
                body: JSON.stringify({ score1: finalScore1, score2: finalScore2, screenshotUrl, notes: notes.trim() || undefined }),
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

    /* Walkover — auto 3-0 or 0-3, no screenshot needed */
    const [showWalkover, setShowWalkover] = useState(false);
    const submitWalkover = useMutation({
        mutationFn: async ({ reason, isSelfForfeit }: { reason: string; isSelfForfeit: boolean }) => {
            if (!matchId) throw new Error("No match selected");
            // If self-forfeit: give 0-3 (opponent wins). Otherwise: 3-0 (I win).
            const myWinScore = isSelfForfeit ? 0 : 3;
            const oppWinScore = isSelfForfeit ? 3 : 0;
            const finalScore1 = isAdmin || !isPlayer2 ? myWinScore : oppWinScore;
            const finalScore2 = isAdmin || !isPlayer2 ? oppWinScore : myWinScore;
            const res = await fetch(`/api/bracket-matches/${matchId}/submit-result`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    score1: finalScore1,
                    score2: finalScore2,
                    notes: `Walkover — ${reason}`,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit walkover");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Walkover confirmed!");
            if (tournamentId) queryClient.invalidateQueries({ queryKey: ["bracket", tournamentId] });
            setShowWalkover(false);
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    return (
        <>
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="sm">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 pb-0">
                    <Trophy className="h-4 w-4 text-primary" />
                    {isDisputing ? "Submit Your Version" : isEditing ? "Edit Result" : "Submit Result"}
                </ModalHeader>

                <ModalBody className="gap-3 pt-2 pb-3">
                    <p className="text-[11px] text-foreground/40 text-center">
                        {isDisputing
                            ? <>Enter the score <strong className="text-foreground/60">as you saw it</strong> to raise a dispute.</>
                            : <>Opponent will have time to <strong className="text-foreground/60">confirm or dispute</strong> before auto-confirm.</>
                        }
                    </p>

                    {/* VS Score cards */}
                    <div className="flex items-stretch gap-2">
                        {/* Left side */}
                        <div className={`flex-1 flex flex-col items-center gap-2 rounded-2xl py-3 px-2 ${
                            leftIsPrimary
                                ? "bg-primary/8 border border-primary/20"
                                : "bg-default-100/60 border border-divider"
                        }`}>
                            <Avatar src={leftAvatar || undefined} name={leftName[0]?.toUpperCase() ?? "?"} size="sm"
                                classNames={leftIsPrimary
                                    ? { base: "bg-primary/20", name: "text-primary font-bold" }
                                    : { base: "bg-default-200", name: "text-foreground/40 font-bold" }
                                } />
                            <span className={`text-[10px] font-semibold uppercase tracking-wider truncate max-w-full px-1 text-center leading-none ${
                                leftIsPrimary ? "text-primary/80" : "text-foreground/40"
                            }`}>
                                {leftName}
                            </span>
                            <span className={`text-5xl font-black tabular-nums leading-none select-none ${
                                leftIsPrimary ? "text-primary" : "text-foreground/40"
                            }`}>{leftScore}</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setLeftScore(Math.max(0, leftScore - 1))}
                                    className={`h-8 w-8 rounded-full active:scale-95 flex items-center justify-center transition-all ${
                                        leftIsPrimary ? "bg-primary/15 hover:bg-primary/25" : "bg-default-200 hover:bg-default-300"
                                    }`}>
                                    <Minus className={`h-3.5 w-3.5 ${leftIsPrimary ? "text-primary" : "text-foreground/50"}`} />
                                </button>
                                <button type="button" onClick={() => setLeftScore(leftScore + 1)}
                                    className={`h-8 w-8 rounded-full active:scale-95 flex items-center justify-center transition-all ${
                                        leftIsPrimary ? "bg-primary/20 hover:bg-primary/30" : "bg-default-200 hover:bg-default-300"
                                    }`}>
                                    <Plus className={`h-3.5 w-3.5 ${leftIsPrimary ? "text-primary" : "text-foreground/50"}`} />
                                </button>
                            </div>
                        </div>

                        {/* VS divider with swap button */}
                        <div className="flex flex-col items-center justify-center gap-1 shrink-0">
                            <div className="flex-1 w-px bg-divider" />
                            <button
                                type="button"
                                onClick={() => setSwapped(!swapped)}
                                title="Swap player positions"
                                className="p-1.5 rounded-full bg-default-100 hover:bg-default-200 active:scale-90 transition-all"
                            >
                                <ArrowLeftRight className="h-3 w-3 text-foreground/40" />
                            </button>
                            <div className="flex-1 w-px bg-divider" />
                        </div>

                        {/* Right side */}
                        <div className={`flex-1 flex flex-col items-center gap-2 rounded-2xl py-3 px-2 ${
                            !leftIsPrimary
                                ? "bg-primary/8 border border-primary/20"
                                : "bg-default-100/60 border border-divider"
                        }`}>
                            <Avatar src={rightAvatar || undefined} name={rightName[0]?.toUpperCase() ?? "?"} size="sm"
                                classNames={!leftIsPrimary
                                    ? { base: "bg-primary/20", name: "text-primary font-bold" }
                                    : { base: "bg-default-200", name: "text-foreground/40 font-bold" }
                                } />
                            <span className={`text-[10px] font-semibold uppercase tracking-wider truncate max-w-full px-1 text-center leading-none ${
                                !leftIsPrimary ? "text-primary/80" : "text-foreground/40"
                            }`}>
                                {rightName}
                            </span>
                            <span className={`text-5xl font-black tabular-nums leading-none select-none ${
                                !leftIsPrimary ? "text-primary" : "text-foreground/40"
                            }`}>{rightScore}</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setRightScore(Math.max(0, rightScore - 1))}
                                    className={`h-8 w-8 rounded-full active:scale-95 flex items-center justify-center transition-all ${
                                        !leftIsPrimary ? "bg-primary/15 hover:bg-primary/25" : "bg-default-200 hover:bg-default-300"
                                    }`}>
                                    <Minus className={`h-3.5 w-3.5 ${!leftIsPrimary ? "text-primary" : "text-foreground/50"}`} />
                                </button>
                                <button type="button" onClick={() => setRightScore(rightScore + 1)}
                                    className={`h-8 w-8 rounded-full active:scale-95 flex items-center justify-center transition-all ${
                                        !leftIsPrimary ? "bg-primary/20 hover:bg-primary/30" : "bg-default-200 hover:bg-default-300"
                                    }`}>
                                    <Plus className={`h-3.5 w-3.5 ${!leftIsPrimary ? "text-primary" : "text-foreground/50"}`} />
                                </button>
                            </div>
                        </div>
                    </div>

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
                                <span className="text-xs">Upload screenshot <span className="text-foreground/25">· {isAdmin ? "optional" : "required"}</span></span>
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </div>

                    {/* Notes — collapsible */}
                    {showNotes ? (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-medium text-foreground/40 flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> Note
                                </span>
                                <button onClick={() => { setShowNotes(false); setNotes(""); }}
                                    className="text-foreground/30 hover:text-foreground/60 transition-colors">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                                placeholder="e.g. Game disconnected at 4-3, rematch ended 2-1"
                                rows={2}
                                className="w-full rounded-lg border border-divider bg-default-50/50 px-3 py-2 text-xs text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/40 resize-none"
                            />
                            <p className="text-[10px] text-foreground/25 text-right">{notes.length}/200</p>
                        </div>
                    ) : (
                        <button onClick={() => setShowNotes(true)}
                            className="flex items-center gap-1.5 text-[11px] text-foreground/30 hover:text-foreground/50 transition-colors self-start">
                            <MessageSquare className="h-3 w-3" />
                            + Add note <span className="text-foreground/20">· optional</span>
                        </button>
                    )}
                </ModalBody>

                <ModalFooter className="pt-0 gap-2 flex-wrap">
                    {/* Walkover — only for players, not during disputes */}
                    {!isDisputing && (
                        <Button
                            variant="flat"
                            color="warning"
                            size="sm"
                            className="mr-auto"
                            isLoading={submitWalkover.isPending}
                            isDisabled={submitResult.isPending || uploading}
                            onPress={() => setShowWalkover(true)}
                            startContent={!submitWalkover.isPending ? <UserX className="h-3.5 w-3.5" /> : undefined}
                        >
                            Walkover
                        </Button>
                    )}
                    <Button variant="flat" onPress={handleClose} size="sm">Cancel</Button>
                    <Button
                        color="primary"
                        size="sm"
                        isLoading={submitResult.isPending || uploading}
                        isDisabled={submitWalkover.isPending}
                        onPress={() => {
                            if (isDraw && !drawsAllowed) { toast.error("Draws not allowed — there must be a winner"); return; }
                            if (!isAdmin && !screenshot) { toast.error("Please upload a screenshot of the result"); return; }
                            submitResult.mutate();
                        }}
                        startContent={!submitResult.isPending && !uploading ? <Upload className="h-3.5 w-3.5" /> : undefined}
                    >
                        {uploading ? "Uploading..." : isEditing ? "Update" : "Submit"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

        {/* Walkover reason modal */}
        <WalkoverModal
            isOpen={showWalkover}
            onClose={() => setShowWalkover(false)}
            onSubmit={(reason, isSelfForfeit) => submitWalkover.mutate({ reason, isSelfForfeit })}
            isPending={submitWalkover.isPending}
        />
        </>
    );
}

/* ─── Walkover Modal ────────────────────────────────────────── */

function WalkoverModal({
    isOpen, onClose, onSubmit, isPending,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, isSelfForfeit: boolean) => void;
    isPending: boolean;
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} placement="center" size="sm">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 pb-0">
                    <UserX className="h-4 w-4 text-warning" />
                    Walkover
                </ModalHeader>
                <ModalBody className="gap-3 pt-2 pb-3">
                    <p className="text-[11px] text-foreground/40 text-center">
                        Score will be recorded as <strong className="text-foreground/60">3-0</strong>. Confirms instantly — no dispute window.
                    </p>

                    <div className="grid gap-2">
                        <Button
                            color="success"
                            variant="flat"
                            size="lg"
                            className="w-full font-semibold"
                            isLoading={isPending}
                            onPress={() => onSubmit("Opponent chose to walkover", false)}
                        >
                            Opponent walkover
                        </Button>
                        <Button
                            color="danger"
                            variant="flat"
                            size="lg"
                            className="w-full font-semibold"
                            isLoading={isPending}
                            onPress={() => onSubmit("I choose to walkover", true)}
                        >
                            I walkover
                        </Button>
                    </div>
                </ModalBody>
                <ModalFooter className="pt-0">
                    <Button variant="flat" onPress={onClose} size="sm">Cancel</Button>
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
            if (!res.ok) throw new Error(data.message || data.error || "Failed to confirm");
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
