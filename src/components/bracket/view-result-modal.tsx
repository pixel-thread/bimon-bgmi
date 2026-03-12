"use client";

import { useState, useRef, useEffect } from "react";
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Chip, Avatar, Button,
} from "@heroui/react";
import { Camera, Pencil, Save, Minus, Plus, X, Maximize2, Trophy, RotateCcw } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

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

/* ─── Score stepper (edit mode) ─────────────────────────────── */
function ScoreStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest truncate w-full text-center">{label}</span>
            <div className="flex items-center gap-3">
                <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
                    className="h-9 w-9 rounded-full bg-default-100 hover:bg-default-200 active:scale-90 flex items-center justify-center transition-all">
                    <Minus className="h-4 w-4 text-foreground/60" />
                </button>
                <span className="text-4xl font-black tabular-nums w-12 text-center select-none">{value}</span>
                <button type="button" onClick={() => onChange(value + 1)}
                    className="h-9 w-9 rounded-full bg-primary/15 hover:bg-primary/25 active:scale-90 flex items-center justify-center transition-all">
                    <Plus className="h-4 w-4 text-primary" />
                </button>
            </div>
        </div>
    );
}

/* ─── Screenshot with preload + lightbox ─────────────────────── */
function ScreenshotView({ url }: { url: string }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [lightbox, setLightbox] = useState(false);

    // Preload image immediately when URL changes
    useEffect(() => {
        setLoaded(false);
        setError(false);
        const img = new Image();
        img.src = url;
        img.onload = () => setLoaded(true);
        img.onerror = () => setError(true);
        return () => { img.onload = null; img.onerror = null; };
    }, [url]);

    return (
        <>
            {/* Thumbnail */}
            <div
                className="relative rounded-2xl overflow-hidden border border-divider cursor-zoom-in group bg-default-100"
                style={{ background: "rgba(0,0,0,0.3)" }}
                onClick={() => loaded && setLightbox(true)}
            >
                {/* Animated loader while image loads */}
                {!loaded && !error && (
                    <div className="w-full h-44 flex flex-col items-center justify-center gap-3 bg-default-100 rounded-2xl">
                        <Camera className="h-5 w-5 text-foreground/20 animate-pulse" />
                        <div className="w-32 h-1.5 rounded-full bg-foreground/10 overflow-hidden">
                            <div className="h-full w-1/3 rounded-full bg-primary/50 animate-[bounceBar_1.2s_ease-in-out_infinite]" />
                        </div>
                        <span className="text-[10px] text-foreground/30">Loading screenshot…</span>
                    </div>
                )}

                {error ? (
                    <div className="w-full h-28 flex flex-col items-center justify-center gap-2 text-foreground/30">
                        <Camera className="h-6 w-6" />
                        <span className="text-xs">Failed to load image</span>
                    </div>
                ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={url}
                        alt="Match result"
                        style={{
                            filter: loaded ? "blur(0px)" : "blur(8px)",
                            transform: loaded ? "scale(1)" : "scale(1.02)",
                            transition: "filter 0.3s ease, transform 0.3s ease, opacity 0.2s ease",
                        }}
                        className={`w-full max-h-64 object-contain ${loaded ? "opacity-100" : "opacity-0 absolute inset-0"}`}
                    />
                )}

                {/* Expand hint */}
                {loaded && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="h-3.5 w-3.5" />
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightbox(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        onClick={() => setLightbox(false)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={url}
                        alt="Match result full"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

/* ─── Main Modal ─────────────────────────────────────────────── */
export function ViewResultModal({ isOpen, onClose, match, isAdmin = false, tournamentId }: ViewResultModalProps) {
    const [editing, setEditing] = useState(false);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (editing && match) { setScore1(match.score1 ?? 0); setScore2(match.score2 ?? 0); }
    }, [editing, match]);

    useEffect(() => {
        if (!isOpen) { setEditing(false); setScore1(0); setScore2(0); clearFile(); }
    }, [isOpen]);

    const clearFile = () => {
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

    const handleClose = () => { setEditing(false); clearFile(); onClose(); };

    const [removeScreenshot, setRemoveScreenshot] = useState(false);

    useEffect(() => {
        if (!isOpen) setRemoveScreenshot(false);
    }, [isOpen]);

    const adminSave = useMutation({
        mutationFn: async () => {
            setUploading(true);
            let finalScreenshotUrl: string | null | undefined = undefined;
            if (removeScreenshot) {
                finalScreenshotUrl = null; // explicitly clear
            } else if (screenshot) {
                const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
                if (!apiKey) throw new Error("ImgBB API key not configured");
                const fd = new FormData();
                const compressed = await compressImage(screenshot);
                fd.append("image", compressed);
                fd.append("name", `bracket-admin-${match?.id}-${Date.now()}`);
                const up = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: fd });
                const upData = await up.json();
                if (!upData.success) throw new Error(upData.error?.message || "Upload failed");
                finalScreenshotUrl = upData.data.url;
            } else {
                finalScreenshotUrl = match?.screenshotUrl || null;
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
            if (tournamentId) await queryClient.refetchQueries({ queryKey: ["bracket", tournamentId], type: "active" });
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
        onSettled: () => setUploading(false),
    });

    const adminReset = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/bracket-matches/${match?.id}/admin-set-score`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score1: 0, score2: 0, screenshotUrl: null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || "Failed to reset");
            return data;
        },
        onSuccess: async (data) => {
            toast.success(data.message || "Match reset to Pending!");
            if (tournamentId) await queryClient.refetchQueries({ queryKey: ["bracket", tournamentId], type: "active" });
            handleClose();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    if (!match) return null;

    const p1Won = match.winnerId === match.player1Id;
    const p2Won = match.winnerId === match.player2Id;
    const hasResult = match.score1 != null && match.score2 != null;
    const screenshotToShow = previewUrl ?? match.screenshotUrl ?? null;

    const statusColor = match.status === "CONFIRMED" ? "success" : match.status === "SUBMITTED" ? "warning" : match.status === "DISPUTED" ? "danger" : "default";
    const statusLabel = match.status === "CONFIRMED" ? "✅ Confirmed" : match.status === "SUBMITTED" ? "⏰ Awaiting confirmation" : match.status === "DISPUTED" ? "⚠️ Disputed" : match.status;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="sm">
            <ModalContent>
                <ModalHeader className="flex items-center gap-2 pb-0">
                    <Trophy className="h-4 w-4 text-primary" />
                    {editing ? "Edit Result" : "Match Result"}
                </ModalHeader>

                <ModalBody className="gap-4 py-4">
                    {editing ? (
                        /* ── Edit mode ── */
                        <>
                            <div className="flex items-center gap-2 py-1">
                                <ScoreStepper label={match.player1 ?? "Player 1"} value={score1} onChange={setScore1} />
                                <span className="text-2xl font-light text-foreground/20">—</span>
                                <ScoreStepper label={match.player2 ?? "Player 2"} value={score2} onChange={setScore2} />
                            </div>

                            {/* Screenshot upload */}
                            <div className="space-y-2">
                                <p className="text-[11px] font-medium text-foreground/40">
                                    Screenshot {(match.screenshotUrl && !removeScreenshot) ? "(existing — tap to replace)" : "(optional)"}
                                </p>
                                {screenshotToShow && !removeScreenshot ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-divider">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={screenshotToShow} alt="Score screenshot" className="w-full max-h-44 object-contain bg-black/40" />
                                        <button onClick={() => { clearFile(); setRemoveScreenshot(true); }}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-danger/80 transition-colors" title="Remove screenshot">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ) : removeScreenshot ? (
                                    <div className="flex items-center justify-between rounded-2xl border border-dashed border-warning/40 bg-warning/5 px-3 py-2">
                                        <span className="text-[11px] text-warning">Screenshot will be removed</span>
                                        <button onClick={() => setRemoveScreenshot(false)} className="text-[10px] text-foreground/40 hover:text-foreground/70 underline">Undo</button>
                                    </div>
                                ) : null}
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-foreground/10 hover:border-primary/40 p-3.5 transition-colors text-sm text-foreground/40 hover:text-foreground/60">
                                    <Camera className="h-4 w-4" />
                                    {(screenshotToShow && !removeScreenshot) ? "Replace screenshot" : "Upload screenshot"}
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            </div>

                            {score1 === score2 && (
                                <p className="text-xs text-warning text-center font-medium bg-warning/10 rounded-xl py-2 px-3">
                                    ⚠️ Equal scores — saving will reset to Pending so players can re-submit
                                </p>
                            )}
                        </>
                    ) : (
                        /* ── View mode ── */
                        <>
                            {/* Scoreboard card — no status inside, more room for names */}
                            <div className="relative rounded-2xl border border-divider overflow-hidden bg-default-50">
                                <div className="flex items-center">
                                    {/* P1 */}
                                    <div className="flex flex-col items-center gap-2 flex-1 min-w-0 px-3 py-4">
                                        <Avatar src={match.player1Avatar || undefined} name={match.player1?.[0] || "?"} size="md" />
                                        <span className="text-[10px] font-semibold truncate w-full text-center">
                                            {match.player1 || "TBD"}
                                        </span>
                                    </div>

                                    {/* Score only — no status badge here */}
                                    <div className="flex items-center gap-1.5 shrink-0 px-2">
                                        <span className={`text-5xl font-black tabular-nums leading-none ${p1Won ? "text-success" : hasResult ? "text-foreground/50" : "text-foreground/20"}`}>
                                            {hasResult ? match.score1 : "—"}
                                        </span>
                                        <span className="text-foreground/15 font-bold text-2xl">:</span>
                                        <span className={`text-5xl font-black tabular-nums leading-none ${p2Won ? "text-success" : hasResult ? "text-foreground/50" : "text-foreground/20"}`}>
                                            {hasResult ? match.score2 : "—"}
                                        </span>
                                    </div>

                                    {/* P2 */}
                                    <div className="flex flex-col items-center gap-2 flex-1 min-w-0 px-3 py-4">
                                        <Avatar src={match.player2Avatar || undefined} name={match.player2?.[0] || "?"} size="md" />
                                        <span className="text-[10px] font-semibold truncate w-full text-center">
                                            {match.player2 || "TBD"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status badge — below the card, centered */}
                            <div className="flex justify-center -mt-1">
                                <Chip size="sm" variant="flat" color={statusColor} className="text-[10px]">
                                    {statusLabel}
                                </Chip>
                            </div>

                            {/* Screenshot */}
                            {screenshotToShow ? (
                                <ScreenshotView url={screenshotToShow} />
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-divider">
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
                            <Button variant="flat" size="sm" onPress={() => { setEditing(false); clearFile(); }}
                                isDisabled={adminSave.isPending || uploading}>Cancel</Button>
                            <Button color={score1 === score2 ? "warning" : "primary"} size="sm"
                                isLoading={adminSave.isPending || uploading}
                                isDisabled={adminSave.isPending || uploading}
                                onPress={() => adminSave.mutate()}
                                startContent={!adminSave.isPending && !uploading ? <Save className="h-3.5 w-3.5" /> : undefined}>
                                {uploading ? "Uploading…" : score1 === score2 ? "Reset Match" : "Save Result"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="flat" size="sm" onPress={handleClose}>Close</Button>
                            {isAdmin && hasResult && (
                                <Button color="danger" variant="flat" size="sm"
                                    startContent={<RotateCcw className="h-3.5 w-3.5" />}
                                    isLoading={adminReset.isPending}
                                    isDisabled={adminReset.isPending}
                                    onPress={() => adminReset.mutate()}>
                                    Reset
                                </Button>
                            )}
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
