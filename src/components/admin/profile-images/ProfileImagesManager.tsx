"use client";

import React, { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import Image from "next/image";

type ProfileImage = {
    id: string;
    name: string;
    publicUrl: string;
};

type PlayerUsing = {
    id: string;
    userName: string;
};

type DeleteState = {
    imageId: string;
    playersUsing?: PlayerUsing[];
    requiresForce?: boolean;
} | null;

export function ProfileImagesManager() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [deleteState, setDeleteState] = useState<DeleteState>(null);

    // Fetch profile images
    const { data, isLoading, isError } = useQuery({
        queryKey: ["admin-profile-images"],
        queryFn: () => http.get<ProfileImage[]>("/admin/gallery/profile-images"),
    });

    const images = data?.data || [];

    // Upload mutation
    const { mutate: uploadImage, isPending: isUploading } = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("image", file);
            return http.post("/admin/gallery/profile-images", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || "Image uploaded successfully");
                queryClient.invalidateQueries({ queryKey: ["admin-profile-images"] });
            } else {
                toast.error(response.message || "Failed to upload image");
            }
        },
        onError: () => toast.error("Failed to upload image"),
    });

    // Delete mutation
    const { mutate: deleteImage, isPending: isDeleting } = useMutation({
        mutationFn: ({ id, force }: { id: string; force: boolean }) =>
            http.delete(`/admin/gallery/profile-images/${id}${force ? "?force=true" : ""}`),
        onSuccess: (response) => {
            if (response.success) {
                toast.success(response.message || "Image deleted");
                queryClient.invalidateQueries({ queryKey: ["admin-profile-images"] });
                setDeleteState(null);
            } else {
                // Check if players are using this image
                const data = response.data as { playersUsing?: PlayerUsing[]; requiresForce?: boolean } | undefined;
                if (data?.requiresForce && data?.playersUsing && deleteState) {
                    setDeleteState({
                        ...deleteState,
                        playersUsing: data.playersUsing,
                        requiresForce: true,
                    });
                } else {
                    toast.error(response.message || "Failed to delete image");
                    setDeleteState(null);
                }
            }
        },
        onError: () => {
            toast.error("Failed to delete image");
            setDeleteState(null);
        },
    });

    const handleDeleteClick = (imageId: string) => {
        setDeleteState({ imageId });
    };

    const handleDeleteConfirm = () => {
        if (!deleteState) return;

        // If we already know players are using it and user wants to force
        const shouldForce = deleteState.requiresForce;
        deleteImage({ id: deleteState.imageId, force: shouldForce || false });
    };

    const handleFileSelect = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            const file = files[0];
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }
            uploadImage(file);
        },
        [uploadImage]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileSelect(e.dataTransfer.files);
        },
        [handleFileSelect]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-40 w-full" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardContent className="py-12 text-center text-destructive">
                    Failed to load profile images
                </CardContent>
            </Card>
        );
    }

    const isForceDeletePrompt = deleteState?.requiresForce && deleteState?.playersUsing;

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                    ${isUploading ? "pointer-events-none opacity-50" : "cursor-pointer hover:border-primary/50"}
                `}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    disabled={isUploading}
                />
                <div className="flex flex-col items-center gap-3">
                    {isUploading ? (
                        <>
                            <Loader2 className="h-10 w-10 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading...</p>
                        </>
                    ) : (
                        <>
                            <Upload className="h-10 w-10 text-muted-foreground" />
                            <div>
                                <p className="font-medium">Drop an image here or click to upload</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    PNG, JPG, WEBP up to 5MB
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Images Grid */}
            <div>
                <h3 className="text-lg font-medium mb-4">
                    Uploaded Images ({images.length}/20)
                </h3>
                {images.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p>No profile images uploaded yet</p>
                            <p className="text-sm mt-1">Upload images above for players to use</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((image) => (
                            <div key={image.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                                <Image
                                    src={image.publicUrl}
                                    alt={image.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteClick(image.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteState} onOpenChange={() => setDeleteState(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        {isForceDeletePrompt ? (
                            <>
                                <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    Players Using This Image
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3">
                                    <p>
                                        The following {deleteState.playersUsing!.length} player(s) are currently using this image:
                                    </p>
                                    <div className="bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
                                        <ul className="space-y-1">
                                            {deleteState.playersUsing!.map((player) => (
                                                <li key={player.id} className="text-foreground font-medium">
                                                    @{player.userName}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <p className="text-amber-600 font-medium">
                                        Force deleting will reset their profile image to Google.
                                    </p>
                                </AlertDialogDescription>
                            </>
                        ) : (
                            <>
                                <AlertDialogTitle>Delete Profile Image?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove the image from the available profile images.
                                </AlertDialogDescription>
                            </>
                        )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : isForceDeletePrompt ? (
                                "Force Delete"
                            ) : (
                                "Delete"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
