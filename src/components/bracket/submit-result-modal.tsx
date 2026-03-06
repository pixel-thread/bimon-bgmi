"use client";

import { useState, useRef } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Button, Input,
} from "@heroui/react";
import { Upload, Trophy, Camera, X, Image as ImageIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface SubmitResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string | null;
    tournamentId?: string;
}

export function SubmitResultModal({ isOpen, onClose, matchId, tournamentId }: SubmitResultModalProps) {
    const [score1, setScore1] = useState("");
    const [score2, setScore2] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5MB");
            return;
        }

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
        setScore1("");
        setScore2("");
        onClose();
    };

    const submitResult = useMutation({
        mutationFn: async () => {
            if (!matchId) throw new Error("No match selected");
            const s1 = parseInt(score1);
            const s2 = parseInt(score2);
            if (isNaN(s1) || isNaN(s2)) throw new Error("Enter valid scores");
            if (s1 === s2) throw new Error("Draws not allowed — there must be a winner");
            if (!screenshot) throw new Error("Screenshot proof is required");

            setUploading(true);

            // Step 1: Upload screenshot
            let screenshotUrl: string | null = null;
            try {
                const formData = new FormData();
                formData.append("file", screenshot);
                formData.append("folder", `bracket-results/${matchId}`);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload screenshot");
                screenshotUrl = uploadData.url;
            } catch (err: any) {
                throw new Error(`Screenshot upload failed: ${err.message}`);
            }

            // Step 2: Submit result with screenshot URL
            const res = await fetch(`/api/bracket-matches/${matchId}/submit-result`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score1: s1, score2: s2, screenshotUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Result submitted!");
            if (tournamentId) {
                queryClient.invalidateQueries({ queryKey: ["bracket", tournamentId] });
            }
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
        onSettled: () => setUploading(false),
    });

    return (
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="lg">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    Submit Match Result
                </ModalHeader>
                <ModalBody className="gap-4">
                    <p className="text-sm text-foreground/60">
                        Enter the final score and upload a screenshot of the result screen.
                        Your opponent has <strong>30 minutes</strong> to confirm or dispute.
                    </p>

                    {/* Score inputs */}
                    <div className="flex items-center gap-3">
                        <Input
                            label="Your Goals"
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
                            label="Opponent Goals"
                            type="number"
                            min="0"
                            value={score2}
                            onValueChange={setScore2}
                            size="lg"
                            className="flex-1"
                            classNames={{ input: "text-center text-2xl font-bold" }}
                        />
                    </div>

                    {/* Screenshot upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                            <Camera className="h-3.5 w-3.5" />
                            Screenshot Proof <span className="text-danger">*</span>
                        </label>

                        {previewUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-divider">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previewUrl}
                                    alt="Score screenshot"
                                    className="w-full max-h-48 object-contain bg-black/50"
                                />
                                <button
                                    onClick={removeScreenshot}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/50 backdrop-blur-sm">
                                    <p className="text-[11px] text-white/70 truncate">
                                        {screenshot?.name} ({((screenshot?.size ?? 0) / 1024).toFixed(0)} KB)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-foreground/15 hover:border-primary/40 p-6 transition-colors group"
                            >
                                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <ImageIcon className="h-6 w-6 text-primary/60 group-hover:text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-foreground/60 group-hover:text-foreground/80">
                                        Upload final score screen
                                    </p>
                                    <p className="text-[11px] text-foreground/30 mt-0.5">
                                        Tap to choose • PNG, JPG • Max 5MB
                                    </p>
                                </div>
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={handleClose}>Cancel</Button>
                    <Button
                        color="primary"
                        isLoading={submitResult.isPending || uploading}
                        isDisabled={!score1 || !score2 || score1 === score2 || !screenshot}
                        onPress={() => submitResult.mutate()}
                        startContent={!submitResult.isPending && !uploading ? <Upload className="h-4 w-4" /> : undefined}
                    >
                        {uploading ? "Uploading..." : "Submit Result"}
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
