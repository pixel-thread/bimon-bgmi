"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Chip } from "@heroui/react";
import { ImageIcon, Upload, Trash2, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

/**
 * /dashboard/gallery — Manage bracket background images.
 * Upload images that appear as bracket page backgrounds (random per visit).
 * Uses /api/gallery/upload (ImgBB server-side) for storage.
 */
export default function GalleryPage() {
    const queryClient = useQueryClient();
    const fileRef = useRef<HTMLInputElement>(null);
    const [label, setLabel] = useState("");
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Fetch all gallery images (non-character)
    const { data: images, isLoading } = useQuery({
        queryKey: ["gallery"],
        queryFn: async () => {
            const res = await fetch("/api/gallery");
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data ?? []).filter((g: any) => !g.isCharacterImg);
        },
    });

    // Upload via existing /api/gallery/upload endpoint
    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!selectedFile) throw new Error("No file selected");
            setUploading(true);

            // Compress before upload
            const compressed = await compressImage(selectedFile, 1200, 0.85);

            // Upload via server endpoint (handles ImgBB)
            const formData = new FormData();
            formData.append("image", compressed, label || selectedFile.name);

            const res = await fetch("/api/gallery/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload failed");
            }
            return res.json();
        },
        onSuccess: () => {
            toast.success("Image uploaded!");
            queryClient.invalidateQueries({ queryKey: ["gallery"] });
            setLabel("");
            setPreview(null);
            setSelectedFile(null);
            setUploading(false);
        },
        onError: (err: any) => {
            toast.error(err.message || "Upload failed");
            setUploading(false);
        },
    });

    // Delete image
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
        },
        onSuccess: () => {
            toast.success("Image removed");
            queryClient.invalidateQueries({ queryKey: ["gallery"] });
        },
        onError: () => toast.error("Failed to delete"),
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ImageIcon className="h-6 w-6 text-primary" />
                    Bracket Backgrounds
                </h1>
                <p className="text-sm text-foreground/50 mt-1">
                    Upload footballer images shown as bracket page backgrounds. Random one per visit.
                </p>
            </div>

            {/* Upload Section */}
            <div className="rounded-2xl border border-divider bg-foreground/[0.02] p-5 space-y-4">
                <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">Add New</h2>

                {preview ? (
                    <div className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full max-h-64 object-contain rounded-xl bg-black/20"
                        />
                        <button
                            onClick={() => { setPreview(null); setSelectedFile(null); }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full h-40 rounded-xl border-2 border-dashed border-foreground/10 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-foreground/30 hover:text-primary/60"
                    >
                        <Upload className="h-8 w-8" />
                        <span className="text-sm font-medium">Click to select image</span>
                        <span className="text-[10px]">PNG, JPG — auto-compressed</span>
                    </button>
                )}

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                />

                <div className="flex items-center gap-3">
                    <Input
                        size="sm"
                        placeholder="Label (e.g. Messi, Ronaldo)"
                        value={label}
                        onValueChange={setLabel}
                        className="flex-1"
                    />
                    <Button
                        color="primary"
                        size="sm"
                        isDisabled={!selectedFile || uploading}
                        isLoading={uploading}
                        onPress={() => uploadMutation.mutate()}
                        startContent={!uploading ? <Plus className="h-4 w-4" /> : undefined}
                    >
                        Upload
                    </Button>
                </div>
            </div>

            {/* Image Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider">
                        Current Backgrounds
                    </h2>
                    <Chip size="sm" variant="flat" color="primary">
                        {images?.length ?? 0} images
                    </Chip>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : !images?.length ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <ImageIcon className="h-10 w-10 text-foreground/15" />
                        <p className="text-sm text-foreground/40">No backgrounds yet. Upload your first one!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((img: any) => (
                            <div key={img.id} className="group relative rounded-xl overflow-hidden border border-divider bg-black/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={img.publicUrl}
                                    alt={img.name || "Background"}
                                    className="w-full h-36 object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 inset-x-0 p-2 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[11px] text-white font-medium truncate">
                                        {img.name}
                                    </span>
                                    <button
                                        onClick={() => {
                                            if (confirm("Delete this background?")) {
                                                deleteMutation.mutate(img.id);
                                            }
                                        }}
                                        className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors shrink-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
