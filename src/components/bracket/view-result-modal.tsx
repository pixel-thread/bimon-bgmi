"use client";

import { useState, useRef, useEffect } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Chip, Avatar, Button,
} from "@heroui/react";
import { Trophy, Camera, Pencil, Upload, X, Image as ImageIcon, Save, Plus, Minus } from "lucide-react";
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
    isAdmin?: boolean;
    tournamentId?: string;
}

function ScoreStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider truncate max-w-[110px] text-center">{label}</span>
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
                    className="h-8 w-8 rounded-full bg-default-100 hover:bg-default-200 active:scale-95 flex items-center justify-center transition-all">
                    <Minus className="h-3.5 w-3.5 text-foreground/60" />
                </button>
                <span className="text-3xl font-black tabular-nums w-10 text-center select-none">{value}</span>
                <button type="button" onClick={() => onChange(value + 1)}
                    className="h-8 w-8 rounded-full bg-primary/15 hover:bg-primary/25 active:scale-95 flex items-center justify-center transition-all">
                    <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
            </div>
        </div>
    );
}

export function ViewResultModal({ isOpen, onClose, match, isAdmin = false, tournamentId }: ViewResultModalProps) {
    const [editing, setEditing] = useState(false);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    // Pre-load existing scores when entering edit mode
    useEffect(() => {
        if (editing && match) {
            setScore1(match.score1 ?? 0);
            setScore2(match.score2 ?? 0);
        }
    }, [editing, match]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setEditing(false);
            setScore1(0);
            setScore2(0);
            setScreenshot(null);
            setPreviewUrl(null);
        }
    }, [isOpen]);

    const removeScreenshot = () => {
        setScreenshot(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
        setScreenshot(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleClose = () => {
        setEditing(false);
        removeScreenshot();
        onClose();
    };

    // Admin save mutation — uses dedicated admin PATCH endpoint
    const adminSave = useMutation({
        mutationFn: async () => {
            // Equal scores = reset (handled server-side in admin-set-score)
            setUploading(true);

            // Upload screenshot to ImgBB
            let finalScreenshotUrl: string | null = match?.screenshotUrl || null;
            if (screenshot) {
                const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
                if (!apiKey) throw new Error("ImgBB API key not configured");
                const fd = new FormData();
                fd.append("image", screenshot);
                fd.append("name", `bracket-admin-${match?.id}-${Date.now()}`);
                const up = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: fd });
                const upData = await up.json();
                if (!upData.success) throw new Error(upData.error?.message || "Upload failed");
                finalScreenshotUrl = upData.data.url;
            }

            const res = await fetch(`/api/bracket-matches/${match?.id}/admin-set-score`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score1, score2, screenshotUrl: finalScreenshotUrl }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || "Failed to save");
            return { ...data, screenshotUrl: finalScreenshotUrl };
        },
        onSuccess: async (data) => {
            toast.success(data.message || "Score updated!");
            // Force immediate refetch so new screenshot appears when the eye is opened again
            if (tournamentId) {
                await queryClient.refetchQueries({ queryKey: ["bracket", tournamentId], type: "active" });
            }
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
        onSettled: () => setUploading(false),
    });

    // Must be after all hooks
    if (!match) return null;

    const p1Won = match.winnerId === match.player1Id;
    const p2Won = match.winnerId === match.player2Id;
    const hasResult = match.score1 !== null && match.score2 !== null && match.score1 !== undefined && match.score2 !== undefined;
    const screenshotToShow = previewUrl ?? match.screenshotUrl ?? null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="sm">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 pb-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    {editing ? "Edit Result" : "Match Result"}
                </ModalHeader>

                <ModalBody className="gap-4 py-3">
                    {editing ? (
                        /* ── Edit mode: score steppers + screenshot ── */
                        <>
                            <div className="flex items-center gap-2 py-2">
                                <ScoreStepper
                                    label={match.player1 ?? "Player 1"}
                                    value={score1}
                                    onChange={setScore1}
                                />
                                <span className="text-xl font-light text-foreground/20 mb-1">—</span>
                                <ScoreStepper
                                    label={match.player2 ?? "Player 2"}
                                    value={score2}
                                    onChange={setScore2}
                                />
                            </div>

                            {/* Screenshot upload */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground/50 flex items-center gap-1.5">
                                    <Camera className="h-3.5 w-3.5" />
                                    Screenshot {match.screenshotUrl ? "(existing)" : "(optional)"}
                                </label>

                                {screenshotToShow ? (
                                    <div className="relative rounded-xl overflow-hidden border border-divider">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={screenshotToShow} alt="Score screenshot" className="w-full max-h-48 object-contain bg-black/50" />
                                        {previewUrl && (
                                            <button onClick={removeScreenshot}
                                                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ) : null}

                                <button onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-foreground/15 hover:border-primary/40 p-3 transition-colors text-sm text-foreground/50 hover:text-foreground/70">
                                    <ImageIcon className="h-4 w-4" />
                                    {screenshotToShow ? "Replace screenshot" : "Upload screenshot"}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            </div>

                            {score1 === score2 && (
                                <p className="text-xs text-warning text-center font-medium">
                                    ⚠️ Equal scores — saving will reset the match to Pending so players can re-submit
                                </p>
                            )}
                        </>
                    ) : (
                        /* ── View mode: players + score + screenshot ── */
                        <>
                            {/* Score display */}
                            <div className="flex items-center justify-center gap-4 py-2">
                                {/* P1 */}
                                <div className={`flex flex-col items-center gap-1.5 flex-1 ${!p1Won ? "opacity-50" : ""}`}>
                                    <Avatar src={match.player1Avatar || undefined} name={match.player1?.[0] || "?"}
                                        size="md" className={p1Won ? "ring-2 ring-success" : ""} />
                                    <span className="text-xs font-medium truncate max-w-[90px] text-center">{match.player1 || "TBD"}</span>
                                    {p1Won && <Chip size="sm" color="success" variant="flat" startContent={<Trophy className="h-3 w-3" />}>Winner</Chip>}
                                </div>

                                {/* Score */}
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-4xl font-black tabular-nums ${p1Won ? "text-success" : "text-foreground/40"}`}>
                                            {hasResult ? match.score1 : "—"}
                                        </span>
                                        <span className="text-foreground/20 font-bold text-xl">—</span>
                                        <span className={`text-4xl font-black tabular-nums ${p2Won ? "text-success" : "text-foreground/40"}`}>
                                            {hasResult ? match.score2 : "—"}
                                        </span>
                                    </div>
                                    <Chip size="sm" variant="flat"
                                        color={match.status === "CONFIRMED" ? "success" : match.status === "SUBMITTED" ? "warning" : "default"}
                                        className="text-[10px]">
                                        {match.status === "CONFIRMED" ? "✅ Confirmed" :
                                            match.status === "SUBMITTED" ? "⏰ Pending confirmation" : match.status}
                                    </Chip>
                                </div>

                                {/* P2 */}
                                <div className={`flex flex-col items-center gap-1.5 flex-1 ${!p2Won ? "opacity-50" : ""}`}>
                                    <Avatar src={match.player2Avatar || undefined} name={match.player2?.[0] || "?"}
                                        size="md" className={p2Won ? "ring-2 ring-success" : ""} />
                                    <span className="text-xs font-medium truncate max-w-[90px] text-center">{match.player2 || "TBD"}</span>
                                    {p2Won && <Chip size="sm" color="success" variant="flat" startContent={<Trophy className="h-3 w-3" />}>Winner</Chip>}
                                </div>
                            </div>

                            {/* Screenshot */}
                            {match.screenshotUrl ? (
                                <div className="rounded-xl overflow-hidden border border-divider">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={match.screenshotUrl} alt="Match result screenshot"
                                        className="w-full max-h-64 object-contain bg-black/50" />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground/5 border border-dashed border-divider">
                                    <Camera className="h-4 w-4 text-foreground/20" />
                                    <span className="text-xs text-foreground/30">No screenshot uploaded</span>
                                </div>
                            )}
                        </>
                    )}
                </ModalBody>

                <ModalFooter className="pt-1 gap-2">
                    {editing ? (
                        <>
                            <Button variant="flat" size="sm" onPress={() => { setEditing(false); removeScreenshot(); }}
                                isDisabled={adminSave.isPending || uploading}>
                                Cancel
                            </Button>
                            <Button color={score1 === score2 ? "warning" : "primary"} size="sm"
                                isLoading={adminSave.isPending || uploading}
                                isDisabled={adminSave.isPending || uploading}
                                onPress={() => adminSave.mutate()}
                                startContent={!adminSave.isPending && !uploading ? <Save className="h-3.5 w-3.5" /> : undefined}>
                                {uploading ? "Uploading..." : score1 === score2 ? "Reset Match" : "Save Result"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="flat" size="sm" onPress={handleClose}>Close</Button>
                            {isAdmin && (
                                <Button color="warning" variant="flat" size="sm"
                                    startContent={<Pencil className="h-3.5 w-3.5" />}
                                    onPress={() => setEditing(true)}>
                                    {hasResult ? "Edit Result" : "Enter Result"}
                                </Button>
                            )}
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
