"use client";

import { useState, useRef } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Chip, Avatar, Button, Input,
} from "@heroui/react";
import { Trophy, Camera, User, Pencil, Upload, X, Image as ImageIcon, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ViewResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    match: {
        id: string;
        player1?: string | null;
        player2?: string | null;
        player1Avatar?: string | null;
        player2Avatar?: string | null;
        score1?: number | null;
        score2?: number | null;
        winnerId?: string | null;
        player1Id?: string | null;
        player2Id?: string | null;
        status: string;
        screenshotUrl?: string | null;
    } | null;
    /** Whether the viewer is an admin (shows edit controls) */
    isAdmin?: boolean;
    /** Tournament ID for cache invalidation */
    tournamentId?: string;
}

export function ViewResultModal({ isOpen, onClose, match, isAdmin = false, tournamentId }: ViewResultModalProps) {
    const [editing, setEditing] = useState(false);
    const [score1, setScore1] = useState("");
    const [score2, setScore2] = useState("");
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    if (!match) return null;

    const p1Won = match.winnerId === match.player1Id;
    const p2Won = match.winnerId === match.player2Id;
    const hasResult = match.score1 !== null && match.score2 !== null;

    const startEditing = () => {
        setScore1(match.score1?.toString() ?? "");
        setScore2(match.score2?.toString() ?? "");
        setPreviewUrl(null);
        setScreenshot(null);
        setEditing(true);
    };

    const cancelEditing = () => {
        setEditing(false);
        setScore1("");
        setScore2("");
        removeScreenshot();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Please upload an image file");
            return;
        }
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
        cancelEditing();
        onClose();
    };

    const adminSubmit = useMutation({
        mutationFn: async () => {
            const s1 = parseInt(score1);
            const s2 = parseInt(score2);
            if (isNaN(s1) || isNaN(s2)) throw new Error("Enter valid scores");
            if (s1 === s2) throw new Error("Draws not allowed — there must be a winner");

            setUploading(true);

            // Upload screenshot if provided
            let screenshotUrl = match.screenshotUrl || null;
            if (screenshot) {
                const formData = new FormData();
                formData.append("file", screenshot);
                formData.append("folder", `bracket-results/${match.id}`);
                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.error || "Failed to upload");
                screenshotUrl = uploadData.url;
            }

            // Submit result as admin
            const res = await fetch(`/api/bracket-matches/${match.id}/submit-result`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    score1: s1,
                    score2: s2,
                    screenshotUrl,
                    adminOverride: true,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || "Result updated!");
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
                    {editing ? "Edit Match Result" : "Match Result"}
                </ModalHeader>
                <ModalBody className="pb-6 space-y-4">
                    {/* Score display / edit */}
                    <div className="flex items-center justify-center gap-4 py-4">
                        {/* Player 1 */}
                        <div className={`flex flex-col items-center gap-2 flex-1 ${!editing && p1Won ? "" : !editing ? "opacity-50" : ""}`}>
                            <Avatar
                                src={match.player1Avatar || undefined}
                                name={match.player1?.[0] || "?"}
                                size="lg"
                                className={!editing && p1Won ? "ring-2 ring-success" : ""}
                            />
                            <span className="text-sm font-medium truncate max-w-[120px]">
                                {match.player1 || "TBD"}
                            </span>
                            {!editing && p1Won && (
                                <Chip size="sm" color="success" variant="flat" startContent={<Trophy className="h-3 w-3" />}>
                                    Winner
                                </Chip>
                            )}
                        </div>

                        {/* Score */}
                        {editing ? (
                            <div className="flex items-center gap-3">
                                <Input
                                    type="number"
                                    min="0"
                                    value={score1}
                                    onValueChange={setScore1}
                                    size="lg"
                                    className="w-20"
                                    classNames={{ input: "text-center text-2xl font-bold" }}
                                />
                                <span className="text-foreground/20 font-bold text-xl">—</span>
                                <Input
                                    type="number"
                                    min="0"
                                    value={score2}
                                    onValueChange={setScore2}
                                    size="lg"
                                    className="w-20"
                                    classNames={{ input: "text-center text-2xl font-bold" }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className={`text-4xl font-black ${p1Won ? "text-success" : "text-foreground/40"}`}>
                                    {match.score1 ?? "-"}
                                </span>
                                <span className="text-foreground/20 font-bold text-xl">—</span>
                                <span className={`text-4xl font-black ${p2Won ? "text-success" : "text-foreground/40"}`}>
                                    {match.score2 ?? "-"}
                                </span>
                            </div>
                        )}

                        {/* Player 2 */}
                        <div className={`flex flex-col items-center gap-2 flex-1 ${!editing && p2Won ? "" : !editing ? "opacity-50" : ""}`}>
                            <Avatar
                                src={match.player2Avatar || undefined}
                                name={match.player2?.[0] || "?"}
                                size="lg"
                                className={!editing && p2Won ? "ring-2 ring-success" : ""}
                            />
                            <span className="text-sm font-medium truncate max-w-[120px]">
                                {match.player2 || "TBD"}
                            </span>
                            {!editing && p2Won && (
                                <Chip size="sm" color="success" variant="flat" startContent={<Trophy className="h-3 w-3" />}>
                                    Winner
                                </Chip>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    {!editing && (
                        <div className="flex justify-center">
                            <Chip
                                size="sm"
                                variant="flat"
                                color={match.status === "CONFIRMED" ? "success" : match.status === "SUBMITTED" ? "warning" : "default"}
                            >
                                {match.status === "CONFIRMED" ? "✅ Confirmed" :
                                    match.status === "SUBMITTED" ? "⏰ Awaiting Confirmation" :
                                        match.status}
                            </Chip>
                        </div>
                    )}

                    {/* Screenshot — view or upload */}
                    {editing ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/70 flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5" />
                                Screenshot
                            </label>

                            {(previewUrl || match.screenshotUrl) ? (
                                <div className="relative rounded-xl overflow-hidden border border-divider">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={previewUrl || match.screenshotUrl || ""}
                                        alt="Score screenshot"
                                        className="w-full max-h-48 object-contain bg-black/50"
                                    />
                                    {previewUrl && (
                                        <button
                                            onClick={removeScreenshot}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ) : null}

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-foreground/15 hover:border-primary/40 p-3 transition-colors text-sm text-foreground/50 hover:text-foreground/70"
                            >
                                <ImageIcon className="h-4 w-4" />
                                {previewUrl || match.screenshotUrl ? "Replace screenshot" : "Upload screenshot"}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : match.screenshotUrl ? (
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground/50 flex items-center gap-1.5">
                                <Camera className="h-3 w-3" />
                                Screenshot Proof
                            </label>
                            <div className="rounded-xl overflow-hidden border border-divider">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={match.screenshotUrl}
                                    alt="Match result screenshot"
                                    className="w-full max-h-64 object-contain bg-black/50"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground/5 border border-divider">
                            <Camera className="h-4 w-4 text-foreground/30" />
                            <span className="text-xs text-foreground/40">No screenshot uploaded</span>
                        </div>
                    )}
                </ModalBody>

                {/* Admin footer with edit/save */}
                {isAdmin && (
                    <ModalFooter>
                        {editing ? (
                            <>
                                <Button variant="flat" onPress={cancelEditing} isDisabled={uploading}>
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    isLoading={adminSubmit.isPending || uploading}
                                    isDisabled={!score1 || !score2 || score1 === score2}
                                    onPress={() => adminSubmit.mutate()}
                                    startContent={!adminSubmit.isPending && !uploading ? <Save className="h-4 w-4" /> : undefined}
                                >
                                    {uploading ? "Uploading..." : "Save Result"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                color="primary"
                                variant="flat"
                                onPress={startEditing}
                                startContent={<Pencil className="h-4 w-4" />}
                            >
                                {hasResult ? "Edit Result" : "Enter Result"}
                            </Button>
                        )}
                    </ModalFooter>
                )}
            </ModalContent>
        </Modal>
    );
}
