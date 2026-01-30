"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
import { Camera, CloudUpload, ImageIcon, Loader2, Trash2, User, Check, X, RefreshCw, Copy, HelpCircle, Video, Crown } from "lucide-react";
import Image from "next/image";
import { useDialogBackHandler } from "@/src/hooks/useDialogBackHandler";
import { compressProfileImage, compressCharacterImage } from "@/src/utils/image/compressImage";
import { videoToGif, isVideoFile } from "@/src/utils/image/videoToGif";
import { useRoyalPass } from "@/src/hooks/royal-pass/useRoyalPass";
import { cn } from "@/src/lib/utils";
import { generateRandomPrompt } from "@/src/data/ai-prompt-styles";

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
    displayName?: string;
    className?: string;
    children?: React.ReactNode;
}

export function ProfileImageSheet({ userName, displayName, className, children }: ProfileImageSheetProps) {
    const router = useRouter();
    const { user: clerkUser } = useUser();
    const { hasRoyalPass: _hasRoyalPass } = useRoyalPass();
    const hasRoyalPass = _hasRoyalPass;
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isConvertingGif, setIsConvertingGif] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [showUploadChoice, setShowUploadChoice] = useState(false);
    const [uploadTargetType, setUploadTargetType] = useState<"profile" | "character">("profile");
    const [pendingImageId, setPendingImageId] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<"upload" | "remove" | "gallery" | null>(null);
    const [promptData, setPromptData] = useState(() => generateRandomPrompt());
    const [isCopied, setIsCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [showTutorialModal, setShowTutorialModal] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // For portal rendering
    useEffect(() => {
        setMounted(true);
    }, []);

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
                setPendingAction(null);
            } else {
                toast.error(response.message || "Failed to update image");
                setPendingAction(null);
            }
        },
        onError: () => {
            toast.error("Failed to update profile image");
            setPendingAction(null);
        },
    });

    const handleOpenChange = useCallback((open: boolean) => {
        if (!open) {
            // Reset state when closing
            setShowGallery(false);
            setShowUploadChoice(false);
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

        // Validate file type - allow videos for character images
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
            toast.error("Please select an image or video file");
            return;
        }

        // Only allow videos for character images
        if (isVideo && uploadTargetType !== "character") {
            toast.error("Videos are only supported for character images");
            return;
        }

        try {
            setIsCompressing(true);

            let compressedFile: File;
            let wasVideoConversion = false;
            let thumbnailBlob: Blob | null = null;

            // Character image upload is restricted to Royal Pass holders
            if (uploadTargetType === "character" && !hasRoyalPass) {
                toast.error("Character image is a Royal Pass feature. Get Royal Pass to customize your podium card!");
                return;
            }

            // Check if it's a video file (for character images only)
            if (uploadTargetType === "character" && isVideoFile(file)) {
                setIsConvertingGif(true);
                setIsCompressing(false);
                try {
                    // Import getVideoThumbnail dynamically
                    const { getVideoThumbnail } = await import("@/src/utils/image/videoToGif");

                    // Extract thumbnail first
                    thumbnailBlob = await getVideoThumbnail(file);

                    // Convert video to GIF
                    compressedFile = await videoToGif(file, {
                        maxWidth: 270,
                        maxHeight: 480,
                        fps: 10,
                        maxDuration: 5,
                    });
                    wasVideoConversion = true;
                    toast.success(`Video converted to GIF (${(compressedFile.size / 1024).toFixed(0)}KB)`);
                } catch (err) {
                    console.error("Video conversion error:", err);
                    toast.error(err instanceof Error ? err.message : "Failed to convert video to GIF");
                    setIsConvertingGif(false);
                    return;
                }
                setIsConvertingGif(false);
            } else {
                // Use different compression based on target type
                // Character images get strict 9:16 center-crop, profile images stay square
                compressedFile = uploadTargetType === "character"
                    ? await compressCharacterImage(file)
                    : await compressProfileImage(file);
            }

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
                if (uploadTargetType === "character") {
                    // If it was a video conversion, also upload the thumbnail
                    let thumbnailUrl: string | undefined;
                    if (wasVideoConversion && thumbnailBlob) {
                        try {
                            const thumbFormData = new FormData();
                            thumbFormData.append("image", thumbnailBlob, "thumbnail.jpg");
                            const thumbResponse = await axiosInstance.post("/upload/image", thumbFormData, {
                                headers: { "Content-Type": "multipart/form-data" },
                            });
                            if (thumbResponse.data.success && thumbResponse.data.data?.url) {
                                thumbnailUrl = thumbResponse.data.data.url;
                            }
                        } catch {
                            console.warn("Failed to upload thumbnail, proceeding without it");
                        }
                    }

                    // Save as character image via different endpoint
                    try {
                        const charResponse = await axiosInstance.post("/profile/character-image", {
                            imageUrl: result.data.url,
                            isAnimated: wasVideoConversion,
                            thumbnailUrl: thumbnailUrl,
                        });
                        if (charResponse.data.success) {
                            toast.success(wasVideoConversion ? "Animated character image saved!" : "Character image updated!");
                            queryClient.invalidateQueries({ queryKey: ["auth"] });
                            setIsOpen(false);
                        } else {
                            toast.error(charResponse.data.message || "Failed to update character image");
                        }
                    } catch (err) {
                        toast.error("Failed to save character image");
                    }
                } else {
                    // Save as profile image
                    updateImage({
                        imageType: "uploaded",
                        uploadedImageUrl: result.data.url,
                    });
                }
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
        setPendingAction("remove");
        updateImage({ imageType: "google" });
    };

    // Select from gallery
    const handleSelectFromGallery = (imageId: string) => {
        setPendingImageId(imageId);
    };

    // Confirm gallery selection
    const handleConfirmGallerySelection = () => {
        if (pendingImageId) {
            setPendingAction("gallery");
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

    const isProcessing = isPending || isUploading || isCompressing || isConvertingGif;

    return (
        <>
            {/* Clickable Trigger - Use children if provided, otherwise default avatar */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "relative group cursor-pointer transition-transform hover:scale-105 active:scale-95",
                    className
                )}
            >
                {children || (
                    <>
                        {getCurrentImageDisplay()}
                        {/* Camera overlay on hover */}
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Camera className="w-5 h-5 text-white" />
                        </div>
                    </>
                )}
            </button>

            {/* Hidden file input - accept images and videos for character */}
            <input
                ref={fileInputRef}
                type="file"
                accept={uploadTargetType === "character" ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"}
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Bottom Sheet */}
            <Sheet open={isOpen} onOpenChange={handleOpenChange}>
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
                    <SheetHeader className="text-center pb-2">
                        <SheetTitle>Profile Picture</SheetTitle>
                        <SheetDescription>
                            {showGallery
                                ? "Select an image from the gallery"
                                : showUploadChoice
                                    ? "What type of image are you uploading?"
                                    : "Choose how you want to change your profile picture"}
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
                        ) : showUploadChoice ? (
                            <motion.div
                                key="uploadChoice"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="pt-2 pb-6 space-y-3"
                            >
                                {/* Back button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowUploadChoice(false)}
                                    className="text-muted-foreground"
                                >
                                    ← Back to options
                                </Button>

                                {/* Profile Image option */}
                                <button
                                    onClick={() => {
                                        setUploadTargetType("profile");
                                        setTimeout(() => fileInputRef.current?.click(), 50);
                                    }}
                                    disabled={isProcessing}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50 border border-muted"
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        {(isCompressing || isUploading) && uploadTargetType === "profile" ? (
                                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                        ) : (
                                            <User className="w-5 h-5 text-blue-500" />
                                        )}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-medium">
                                            {(isCompressing || isUploading) && uploadTargetType === "profile"
                                                ? (isCompressing ? "Compressing..." : "Uploading...")
                                                : "Profile Image"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {(isCompressing || isUploading) && uploadTargetType === "profile"
                                                ? "Please wait..."
                                                : "Your account avatar (circle)"}
                                        </p>
                                    </div>
                                </button>

                                {/* Character Image option - RP Only */}
                                <div className="w-full rounded-xl border border-muted">
                                    <div className="flex items-center gap-4 p-4">
                                        <button
                                            onClick={() => {
                                                if (!hasRoyalPass) {
                                                    setIsRedirecting(true);
                                                    setTimeout(() => {
                                                        router.push("/royal-pass");
                                                    }, 500);
                                                    return;
                                                }
                                                setUploadTargetType("character");
                                                setTimeout(() => fileInputRef.current?.click(), 50);
                                            }}
                                            disabled={isProcessing || isRedirecting}
                                            className={cn(
                                                "flex items-center gap-4 flex-1 hover:opacity-80 transition-opacity disabled:opacity-50",
                                                !hasRoyalPass && !isRedirecting && "opacity-50"
                                            )}
                                        >
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
                                                {isRedirecting ? (
                                                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                                ) : isConvertingGif && uploadTargetType === "character" ? (
                                                    <Video className="w-5 h-5 text-amber-500 animate-pulse" />
                                                ) : (isCompressing || isUploading) && uploadTargetType === "character" ? (
                                                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-amber-500" />
                                                )}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-medium flex items-center gap-2">
                                                    {isRedirecting
                                                        ? "Redirecting..."
                                                        : (isCompressing || isUploading || isConvertingGif) && uploadTargetType === "character"
                                                            ? (isConvertingGif ? "Converting to GIF..." : isCompressing ? "Compressing..." : "Uploading...")
                                                            : "Character Image"}
                                                    <Crown className="w-4 h-4 text-amber-500" />
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {isRedirecting
                                                        ? "Taking you to Royal Pass..."
                                                        : (isCompressing || isUploading || isConvertingGif) && uploadTargetType === "character"
                                                            ? "Please wait..."
                                                            : "Image or video for podium card"}
                                                </p>
                                            </div>
                                        </button>
                                        {/* AI Prompt icons - visible for all users */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsRegenerating(true);
                                                    setPromptData(generateRandomPrompt());
                                                    setIsCopied(false);
                                                    setTimeout(() => setIsRegenerating(false), 300);
                                                }}
                                                className="p-2 rounded-full hover:bg-purple-500/10 transition-colors"
                                                title="Generate new AI prompt"
                                            >
                                                <RefreshCw className={cn(
                                                    "w-4 h-4 text-purple-500 transition-transform",
                                                    isRegenerating && "animate-spin"
                                                )} />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    try {
                                                        await navigator.clipboard.writeText(promptData.prompt);
                                                        setIsCopied(true);
                                                        toast.success("AI prompt copied!");
                                                        setTimeout(() => setIsCopied(false), 2000);
                                                    } catch {
                                                        toast.error("Failed to copy");
                                                    }
                                                }}
                                                className={cn(
                                                    "p-2 rounded-full transition-colors",
                                                    isCopied ? "bg-green-500/20" : "hover:bg-purple-500/10"
                                                )}
                                                title="Copy AI prompt"
                                            >
                                                {isCopied ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-purple-500" />
                                                )}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowTutorialModal(true);
                                                }}
                                                className="p-2 rounded-full hover:bg-purple-500/10 transition-colors"
                                                title="How to use AI prompt"
                                            >
                                                <HelpCircle className="w-4 h-4 text-purple-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="options"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="pt-2 pb-6 space-y-2"
                            >
                                {/* Upload option - now shows choice first */}
                                <button
                                    onClick={() => setShowUploadChoice(true)}
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
                                            {pendingAction === "remove" ? (
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
                    </AnimatePresence >
                </SheetContent >
            </Sheet >

            {/* Tutorial Video Modal - rendered via portal to avoid Sheet event issues */}
            {
                mounted && createPortal(
                    <AnimatePresence>
                        {showTutorialModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowTutorialModal(false);
                                }}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="relative w-full max-w-sm mx-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Close button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowTutorialModal(false);
                                        }}
                                        className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                    {/* YouTube Shorts embed - 9:16 aspect ratio */}
                                    <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl">
                                        <iframe
                                            src="https://www.youtube.com/embed/JPYNttbdrFk?autoplay=1&loop=1&playlist=JPYNttbdrFk"
                                            title="AI Prompt Tutorial"
                                            className="absolute inset-0 w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                    <p className="text-center text-white/60 text-sm mt-3">Tap outside to close</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )
            }
        </>
    );
}
