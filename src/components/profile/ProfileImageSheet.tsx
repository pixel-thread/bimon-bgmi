"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/src/components/ui/sheet";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Button } from "@/src/components/ui/button";
import http from "@/src/utils/http";
import axiosInstance from "@/src/utils/api";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Camera, CloudUpload, ImageIcon, Loader2, Trash2, User, Check, X } from "lucide-react";
import Image from "next/image";
import { useDialogBackHandler } from "@/src/hooks/useDialogBackHandler";
import { compressProfileImage } from "@/src/utils/image/compressImage";
import { cn } from "@/src/lib/utils";

type ProfileImage = {
    id: string;
    name: string;
    publicUrl: string;
};

type ImageSettings = {
    imageType: "google" | "custom" | "uploaded" | "none";
    customImageId: string | null;
    customImage: ProfileImage | null;
    uploadedImageUrl: string | null;
};

interface ProfileImageSheetProps {
    userName?: string;
    className?: string;
}

export function ProfileImageSheet({ userName, className }: ProfileImageSheetProps) {
    const { user: clerkUser } = useUser();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [pendingImageId, setPendingImageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use the back button handler hook
    const handleOpenChangeWithBack = useDialogBackHandler(isOpen, setIsOpen, "profileImageSheet");

    // Fetch current settings
    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ["profile-image-settings"],
        queryFn: () => http.get<ImageSettings>("/profile/image"),
    });

    // Fetch available profile images (only when gallery is shown)
    const { data: imagesData, isLoading: imagesLoading } = useQuery({
        queryKey: ["profile-images"],
        queryFn: () => http.get<ProfileImage[]>("/profile/images"),
        enabled: showGallery,
    });

    const settings = settingsData?.data;
    const availableImages = imagesData?.data || [];

    // Update mutation
    const { mutate: updateImage, isPending } = useMutation({
        mutationFn: (data: { imageType: string; customImageId?: string; uploadedImageUrl?: string }) =>
            http.patch("/profile/image", data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Profile image updated!");
                queryClient.invalidateQueries({ queryKey: ["profile-image-settings"] });
                queryClient.invalidateQueries({ queryKey: ["auth"] });
                setIsOpen(false);
                setShowGallery(false);
                setPendingImageId(null);
            } else {
                toast.error(response.message || "Failed to update image");
            }
        },
        onError: () => toast.error("Failed to update profile image"),
    });

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            // Reset state when closing
            setShowGallery(false);
            setPendingImageId(null);
        }
        handleOpenChangeWithBack(open);
    }, [handleOpenChangeWithBack]);

    // Handle file upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be selected again
        e.target.value = "";

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        try {
            setIsCompressing(true);

            // Compress the image for profile use (512x512, 200KB max)
            const compressedFile = await compressProfileImage(file);

            setIsCompressing(false);
            setIsUploading(true);

            // Upload to ImgBB via our API
            const formData = new FormData();
            formData.append("image", compressedFile);

            const response = await axiosInstance.post("/upload/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const result = response.data;

            if (result.success && result.data?.url) {
                // Directly save the uploaded image
                updateImage({
                    imageType: "uploaded",
                    uploadedImageUrl: result.data.url,
                });
            } else {
                toast.error(result.message || "Failed to upload image");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsCompressing(false);
            setIsUploading(false);
        }
    };

    // Handle remove (revert to Google image)
    const handleRemove = () => {
        updateImage({ imageType: "google" });
    };

    // Select from gallery
    const handleSelectFromGallery = (imageId: string) => {
        setPendingImageId(imageId);
    };

    // Confirm gallery selection
    const handleConfirmGallerySelection = () => {
        if (pendingImageId) {
            updateImage({
                imageType: "custom",
                customImageId: pendingImageId,
            });
        }
    };

    // Get current display image for the clickable avatar
    const getCurrentImageDisplay = () => {
        if (settingsLoading) {
            return <Skeleton className="h-16 w-16 !rounded-full" />;
        }

        if (settings?.imageType === "none") {
            return (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {userName?.charAt(0).toUpperCase()}
                </div>
            );
        }

        if (settings?.imageType === "uploaded" && settings.uploadedImageUrl) {
            return (
                <Image
                    src={settings.uploadedImageUrl}
                    alt={userName || "Profile"}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                    loading="lazy"
                    unoptimized
                />
            );
        }

        if (settings?.imageType === "custom" && settings.customImage) {
            return (
                <Image
                    src={settings.customImage.publicUrl}
                    alt={userName || "Profile"}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                    loading="lazy"
                />
            );
        }

        // Default: Google image
        if (clerkUser?.imageUrl) {
            return (
                <Image
                    src={clerkUser.imageUrl}
                    alt={userName || "Profile"}
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                    loading="lazy"
                />
            );
        }

        return (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                {userName?.charAt(0).toUpperCase()}
            </div>
        );
    };

    const isProcessing = isPending || isUploading || isCompressing;

    return (
        <>
            {/* Clickable Avatar */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "relative group cursor-pointer transition-transform hover:scale-105 active:scale-95",
                    className
                )}
            >
                {getCurrentImageDisplay()}
                {/* Camera overlay on hover */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                </div>
            </button>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Bottom Sheet */}
            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
                    <SheetHeader className="text-center pb-2">
                        <SheetTitle>Profile Picture</SheetTitle>
                        <SheetDescription>
                            {showGallery ? "Select an image from the gallery" : "Choose how you want to change your profile picture"}
                        </SheetDescription>
                    </SheetHeader>

                    <AnimatePresence mode="wait">
                        {showGallery ? (
                            <motion.div
                                key="gallery"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="pt-2 pb-6 space-y-4"
                            >
                                {/* Back button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowGallery(false);
                                        setPendingImageId(null);
                                    }}
                                    className="text-muted-foreground"
                                >
                                    ← Back to options
                                </Button>

                                {/* Gallery grid */}
                                {imagesLoading ? (
                                    <div className="grid grid-cols-4 gap-3">
                                        {[...Array(8)].map((_, i) => (
                                            <Skeleton key={i} className="aspect-square rounded-xl" />
                                        ))}
                                    </div>
                                ) : availableImages.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        No gallery images available
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3">
                                        {availableImages.map((img) => (
                                            <button
                                                key={img.id}
                                                onClick={() => handleSelectFromGallery(img.id)}
                                                className={cn(
                                                    "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                                                    pendingImageId === img.id
                                                        ? "border-primary ring-2 ring-primary/30 scale-95"
                                                        : "border-transparent hover:border-muted-foreground/25"
                                                )}
                                            >
                                                <Image
                                                    src={img.publicUrl}
                                                    alt={img.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {pendingImageId === img.id && (
                                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                        <Check className="h-6 w-6 text-primary" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Confirm button */}
                                {pendingImageId && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="pt-2"
                                    >
                                        <Button
                                            className="w-full"
                                            onClick={handleConfirmGallerySelection}
                                            disabled={isPending}
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Use This Image"
                                            )}
                                        </Button>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="options"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="pt-2 pb-6 space-y-2"
                            >
                                {/* Upload option */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        {isCompressing || isUploading ? (
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        ) : (
                                            <CloudUpload className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium">
                                            {isCompressing ? "Compressing..." : isUploading ? "Uploading..." : "Upload Photo"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Choose from your device
                                        </p>
                                    </div>
                                </button>

                                {/* Choose from gallery */}
                                <button
                                    onClick={() => setShowGallery(true)}
                                    disabled={isProcessing}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50"
                                >
                                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-violet-500" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium">Choose from Gallery</p>
                                        <p className="text-sm text-muted-foreground">
                                            Select from available images
                                        </p>
                                    </div>
                                </button>

                                {/* Remove option - only show if current image is not google */}
                                {settings?.imageType !== "google" && (
                                    <button
                                        onClick={handleRemove}
                                        disabled={isProcessing}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                            {isPending ? (
                                                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-5 h-5 text-red-500" />
                                            )}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-red-600 dark:text-red-400">Remove Photo</p>
                                            <p className="text-sm text-muted-foreground">
                                                Use Google account picture
                                            </p>
                                        </div>
                                    </button>
                                )}

                                {/* Cancel button */}
                                <div className="pt-2">
                                    <Button
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => setIsOpen(false)}
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </SheetContent>
            </Sheet>
        </>
    );
}
