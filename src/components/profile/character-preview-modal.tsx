"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalBody,
    ModalFooter,
    Avatar,
    Button,
} from "@heroui/react";
import { Crown, X, Target, Swords, Gamepad2, Wallet } from "lucide-react";
import { CategoryBadge } from "@/components/ui/category-badge";

interface CharacterPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (file: File, cropParams?: { x: number; y: number; w: number; h: number }) => void;
    uploading: boolean;
    previewUrl: string;
    isVideo: boolean;
    playerName: string;
    username: string;
    imageUrl: string | null;
    category: string;
    hasRoyalPass: boolean;
    bio: string | null;
    stats: {
        kd: number;
        kills: number;
        matches: number;
        balance: number;
    };
}

const TARGET_RATIO = 3 / 4; // width / height

/**
 * Preview modal with crop (zoom + drag) showing how the character image
 * will look in the Player Stats Modal and on the Podium.
 */
export function CharacterPreviewModal({
    isOpen,
    onClose,
    onConfirm,
    uploading,
    previewUrl,
    isVideo,
    playerName,
    imageUrl,
    category,
    hasRoyalPass,
    bio,
    stats,
}: CharacterPreviewModalProps) {
    const kd = isFinite(stats.kd) ? stats.kd.toFixed(2) : "0.00";

    // ── Crop state ──
    // coverZoom = fills the 3:4 frame completely (like object-cover)
    // zoom=1 = image fully visible (contained)
    // Default starts at coverZoom so user can drag to reposition
    const [zoom, setZoom] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
    const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Calculate the "cover" zoom (fills frame completely)
    const getCoverZoom = useCallback(() => {
        if (!imgSize.w || !containerRef.current) return 1;
        const rect = containerRef.current.getBoundingClientRect();
        const imgRatio = imgSize.w / imgSize.h;
        const containerRatio = rect.width / rect.height;
        if (imgRatio > containerRatio) {
            // Image wider — contained fits by width, cover needs to fill height
            return (rect.height * imgRatio) / rect.width;
        } else {
            // Image taller — contained fits by height, cover needs to fill width
            return rect.width / (rect.height * imgRatio);
        }
    }, [imgSize]);

    // Load media dimensions
    useEffect(() => {
        if (!previewUrl) return;
        if (isVideo) {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.src = previewUrl;
            video.onloadedmetadata = () => setImgSize({ w: video.videoWidth, h: video.videoHeight });
            video.load();
        } else {
            const img = new Image();
            img.src = previewUrl;
            img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
        }
    }, [previewUrl, isVideo]);

    // Set initial zoom to cover when dimensions are loaded
    useEffect(() => {
        if (imgSize.w && containerRef.current) {
            const cover = getCoverZoom();
            setZoom(cover);
            setPos({ x: 0, y: 0 });
        }
    }, [imgSize, getCoverZoom]);

    // Reset when modal opens with new image
    useEffect(() => {
        if (isOpen) {
            setPos({ x: 0, y: 0 });
            // zoom will be set by the imgSize effect above
        }
    }, [isOpen, previewUrl]);

    // Disable browser native pinch-zoom while modal is open
    useEffect(() => {
        if (!isOpen) return;
        const meta = document.querySelector('meta[name="viewport"]');
        const original = meta?.getAttribute("content") || "";
        // Add user-scalable=no to prevent browser zoom
        if (meta && !original.includes("user-scalable=no")) {
            meta.setAttribute("content", original + ", user-scalable=no, maximum-scale=1");
        }
        return () => {
            if (meta) meta.setAttribute("content", original);
        };
    }, [isOpen, isVideo]);

    // Get the "contained" image dimensions (at zoom=1, fully visible)
    const getContainedSize = useCallback((cW: number, cH: number) => {
        if (!imgSize.w) return { w: cW, h: cH };
        const imgRatio = imgSize.w / imgSize.h;
        const containerRatio = cW / cH;
        if (imgRatio > containerRatio) {
            // Image wider — fit by width, height is smaller
            return { w: cW, h: cW / imgRatio };
        } else {
            // Image taller — fit by height, width is smaller
            return { h: cH, w: cH * imgRatio };
        }
    }, [imgSize]);

    // Clamp position so image edge never shows inside the frame (when zoomed past cover)
    const clampPos = useCallback((px: number, py: number, z: number) => {
        const container = containerRef.current;
        if (!container || !imgSize.w) return { x: px, y: py };
        const rect = container.getBoundingClientRect();
        const contained = getContainedSize(rect.width, rect.height);
        const scaledW = contained.w * z;
        const scaledH = contained.h * z;

        // How much the image exceeds the container
        const overflowX = Math.max(0, (scaledW - rect.width) / 2);
        const overflowY = Math.max(0, (scaledH - rect.height) / 2);

        return {
            x: Math.max(-overflowX, Math.min(overflowX, px)),
            y: Math.max(-overflowY, Math.min(overflowY, py)),
        };
    }, [imgSize, getContainedSize]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [pos]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        const newPos = clampPos(dragRef.current.startPosX + dx, dragRef.current.startPosY + dy, zoom);
        setPos(newPos);
    }, [zoom, clampPos]);

    const handlePointerUp = useCallback(() => {
        dragRef.current = null;
    }, []);

    // ── Pinch-to-zoom via native touch events ──
    const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const getDistance = (t: TouchList) => {
            const dx = t[0].clientX - t[1].clientX;
            const dy = t[0].clientY - t[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                pinchRef.current = { dist: getDistance(e.touches), zoom };
                dragRef.current = null;
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && pinchRef.current) {
                e.preventDefault();
                e.stopPropagation();
                const newDist = getDistance(e.touches);
                const scale = newDist / pinchRef.current.dist;
                const newZoom = Math.max(1, Math.min(3, pinchRef.current.zoom * scale));
                setZoom(newZoom);
                setPos(prev => clampPos(prev.x, prev.y, newZoom));
            }
        };

        const onTouchEnd = () => {
            pinchRef.current = null;
        };

        // Prevent Safari gesture zoom (gesturestart/gesturechange)
        const preventGesture = (e: Event) => e.preventDefault();

        // Prevent browser pinch-zoom on the whole document while our modal is active
        const onDocTouchMove = (e: TouchEvent) => {
            if (e.touches.length >= 2 && pinchRef.current) {
                e.preventDefault();
            }
        };

        // Mac trackpad pinch = wheel event with ctrlKey
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                e.stopPropagation();
                const delta = -e.deltaY * 0.01;
                const newZoom = Math.max(1, Math.min(3, zoom + delta));
                setZoom(newZoom);
                setPos(prev => clampPos(prev.x, prev.y, newZoom));
            }
        };

        el.addEventListener("touchstart", onTouchStart, { passive: false });
        el.addEventListener("touchmove", onTouchMove, { passive: false });
        el.addEventListener("touchend", onTouchEnd);
        el.addEventListener("touchcancel", onTouchEnd);
        el.addEventListener("gesturestart", preventGesture);
        el.addEventListener("gesturechange", preventGesture);
        el.addEventListener("wheel", onWheel, { passive: false });
        document.addEventListener("touchmove", onDocTouchMove, { passive: false });

        return () => {
            el.removeEventListener("touchstart", onTouchStart);
            el.removeEventListener("touchmove", onTouchMove);
            el.removeEventListener("touchend", onTouchEnd);
            el.removeEventListener("touchcancel", onTouchEnd);
            el.removeEventListener("gesturestart", preventGesture);
            el.removeEventListener("gesturechange", preventGesture);
            el.removeEventListener("wheel", onWheel);
            document.removeEventListener("touchmove", onDocTouchMove);
        };
    }, [isVideo, zoom, clampPos]);

    // Calculate source crop region from zoom/pos
    const getCropRegion = useCallback(() => {
        const container = containerRef.current;
        if (!container || !imgSize.w) return null;
        const rect = container.getBoundingClientRect();
        const cW = rect.width;
        const cH = rect.height;
        const contained = getContainedSize(cW, cH);
        const scaledW = contained.w * zoom;
        const scaledH = contained.h * zoom;
        const visLeft = (scaledW / 2) - (cW / 2) - pos.x;
        const visTop = (scaledH / 2) - (cH / 2) - pos.y;
        const scaleToSrc = imgSize.w / scaledW;
        return {
            x: Math.round(Math.max(0, visLeft * scaleToSrc)),
            y: Math.round(Math.max(0, visTop * scaleToSrc)),
            w: Math.round(Math.min(imgSize.w, cW * scaleToSrc)),
            h: Math.round(Math.min(imgSize.h, cH * scaleToSrc)),
        };
    }, [imgSize, zoom, pos, getContainedSize]);

    // Crop and upload
    const cropAndUpload = useCallback(async () => {
        if (isVideo) {
            // Send original video + crop params for Cloudinary to crop server-side
            const res = await fetch(previewUrl);
            const blob = await res.blob();
            const file = new File([blob], "character.mp4", { type: blob.type });
            const crop = getCropRegion();
            onConfirm(file, crop || undefined);
            return;
        }

        // Image: crop client-side with canvas
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = previewUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const crop = getCropRegion();
        if (!crop) return;

        const canvas = document.createElement("canvas");
        const outW = 720;
        canvas.width = outW;
        canvas.height = outW / TARGET_RATIO;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/webp", 0.85)
        );
        const file = new File([blob], "character.webp", { type: "image/webp" });
        onConfirm(file);
    }, [previewUrl, isVideo, onConfirm, getCropRegion]);

    // Media style: position absolutely, sized to "contain" at zoom=1, then scaled
    const getImgStyle = useCallback((): React.CSSProperties => {
        if (!containerRef.current || !imgSize.w) return {};
        const rect = containerRef.current.getBoundingClientRect();
        const contained = getContainedSize(rect.width, rect.height);
        return {
            position: "absolute",
            width: contained.w,
            height: contained.h,
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            transition: dragRef.current ? "none" : "transform 0.15s ease-out",
        };
    }, [isVideo, imgSize, pos, zoom, getContainedSize]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            placement="center"
            scrollBehavior="outside"
            hideCloseButton
            classNames={{
                base: "bg-background border border-divider",
                backdrop: "bg-black/60 backdrop-blur-sm",
            }}
        >
            <ModalContent className="!overflow-hidden">
                {/* Close */}
                <button
                    onClick={onClose}
                    disabled={uploading}
                    className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50"
                >
                    <X className="h-4 w-4" />
                </button>

                <ModalBody className="p-0">
                    {/* ── Stats Modal Preview with crop ── */}
                    <div>
                        <div
                            ref={containerRef}
                            className="relative aspect-[3/4] w-full overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing bg-black"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                        >
                            {isVideo ? (
                                <video
                                    src={previewUrl}
                                    autoPlay muted playsInline loop
                                    className="pointer-events-none"
                                    style={getImgStyle()}
                                    onLoadedMetadata={(e) => {
                                        const v = e.currentTarget;
                                        if (!imgSize.w && v.videoWidth) {
                                            setImgSize({ w: v.videoWidth, h: v.videoHeight });
                                        }
                                    }}
                                />
                            ) : (
                                <img
                                    src={previewUrl}
                                    alt=""
                                    className="pointer-events-none"
                                    style={getImgStyle()}
                                    draggable={false}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent pointer-events-none" />

                            {/* Hint */}
                            <div className="absolute top-3 inset-x-0 z-10 flex justify-center pointer-events-none">
                                <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/70 backdrop-blur-sm">
                                    Pinch to adjust
                                </span>
                            </div>

                            {/* Player info overlay */}
                            <div className="absolute bottom-4 left-4 flex items-end gap-3 pointer-events-none">
                                <Avatar
                                    src={imageUrl || undefined}
                                    name={playerName}
                                    className="h-14 w-14 ring-2 ring-background"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2
                                            className="text-lg font-bold text-white"
                                            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.6)" }}
                                        >
                                            {playerName}
                                        </h2>
                                        {hasRoyalPass && <Crown className="h-4 w-4 text-yellow-400" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CategoryBadge category={category} size="sm" />
                                    </div>
                                    {bio && (
                                        <p className="mt-0.5 text-[10px] italic text-foreground/60">
                                            &ldquo;{bio}&rdquo;
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mock stat cards */}
                        <div className="grid grid-cols-2 gap-3 p-4">
                            {[
                                { label: "K/D Ratio", value: kd, icon: Target, color: "text-primary" },
                                { label: "Total Kills", value: stats.kills.toLocaleString(), icon: Swords, color: "text-danger" },
                                { label: "Matches", value: stats.matches.toLocaleString(), icon: Gamepad2, color: "text-success" },
                                { label: "Balance", value: `${stats.balance.toLocaleString()} UC`, icon: Wallet, color: "text-warning" },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-xl border border-divider bg-default-100 p-3">
                                    <div className="flex items-center gap-2">
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                        <span className="text-xs text-foreground/50">{stat.label}</span>
                                    </div>
                                    <p className="mt-1 text-xl font-bold">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter className="gap-2 border-t border-divider">
                    <Button variant="flat" onPress={onClose} isDisabled={uploading} size="sm">
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        size="sm"
                        isLoading={uploading}
                        onPress={cropAndUpload}
                        className="font-medium"
                    >
                        Upload
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
