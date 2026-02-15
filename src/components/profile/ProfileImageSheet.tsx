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
import { Camera, ImageIcon, Loader2, Trash2, User, Check, X, RefreshCw, Copy, HelpCircle, Video, Crown } from "lucide-react";
import Image from "next/image";
import { useDialogBackHandler } from "@/src/hooks/useDialogBackHandler";
import { compressProfileImage, compressCharacterImage } from "@/src/utils/image/compressImage";
import { isVideoFile } from "@/src/utils/image/compressVideo";
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
    hasCharacterImage: boolean;
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
    const { hasRoyalPass } = useRoyalPass();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isConvertingGif, setIsConvertingGif] = useState(false);

    const [uploadTargetType, setUploadTargetType] = useState<"profile" | "character">("profile");
    const [pendingAction, setPendingAction] = useState<"upload" | "remove" | "removeCharacter" | null>(null);
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

    const settings = settingsData?.data;

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

            let thumbnailBlob: Blob | null = null;

            // Character image upload is restricted to Royal Pass holders
            if (uploadTargetType === "character" && !hasRoyalPass) {
                toast.error("Character image is a Royal Pass feature. Get Royal Pass to customize your podium card!");
                return;
            }

            // Check if it's a video file (for character images only)
            if (uploadTargetType === "character" && isVideoFile(file)) {
                setIsConvertingGif(true); // Reuse this state for "processing video"
                setIsCompressing(false);
                try {
                    // Import video utilities
                    const { validateVideo, getVideoThumbnail } = await import("@/src/utils/image/compressVideo");
                    const { uploadVideoToCloudinary } = await import("@/src/services/upload/cloudinary");

                    // Validate video duration and size
                    await validateVideo(file, 10, 50); // max 10 seconds, 50MB (Cloudinary optimizes)

                    // Extract thumbnail for preview
                    thumbnailBlob = await getVideoThumbnail(file, 0.5);

                    // Get Cloudinary config from API
                    const configResponse = await axiosInstance.get("/upload/video");
                    if (!configResponse.data.success || !configResponse.data.data) {
                        throw new Error("Video upload not available");
                    }
                    const { cloudName, uploadPreset, folder } = configResponse.data.data;

                    // Upload video to Cloudinary
                    setIsUploading(true);
                    setIsConvertingGif(false);

                    const uploadResult = await uploadVideoToCloudinary(file, {
                        cloudName,
                        uploadPreset,
                        folder,
                        resourceType: "video",
                    });

                    if (!uploadResult.success || !uploadResult.url) {
                        throw new Error(uploadResult.error || "Video upload failed");
                    }

                    // Upload thumbnail to ImgBB for fallback/preview
                    let thumbnailUrl: string | undefined;
                    if (thumbnailBlob) {
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
                            // Use Cloudinary's auto-generated thumbnail
                            thumbnailUrl = uploadResult.thumbnailUrl;
                        }
                    }

                    // Generate optimized video URL with Cloudinary transformations
                    // This makes the video load faster and look great at the target size
                    let optimizedUrl = uploadResult.url;
                    if (uploadResult.publicId) {
                        // Apply Cloudinary transformations: resize, quality auto, format auto
                        optimizedUrl = `https://res.cloudinary.com/${cloudName}/video/upload/w_540,h_960,c_fill,q_auto,f_auto/${uploadResult.publicId}`;
                    }

                    // Save video as character image with optimized URL
                    const charResponse = await axiosInstance.post("/profile/character-image", {
                        imageUrl: optimizedUrl,
                        isAnimated: true, // Videos are animated content
                        isVideo: true, // New flag to indicate video format
                        thumbnailUrl: thumbnailUrl || uploadResult.thumbnailUrl,
                    });

                    if (charResponse.data.success) {
                        toast.success("Video uploaded!");
                        queryClient.invalidateQueries({ queryKey: ["auth"] });
                        setIsOpen(false);
                    } else {
                        toast.error(charResponse.data.message || "Failed to save character video");
                    }
                } catch (err) {
                    console.error("Video upload error:", err);
                    toast.error(err instanceof Error ? err.message : "Failed to upload video");
                } finally {
                    setIsConvertingGif(false);
                    setIsUploading(false);
                }
                return; // Early return - video flow is complete
            }

            // For images, use different compression based on target type
            const compressedFile = uploadTargetType === "character"
                ? await compressCharacterImage(file)
                : await compressProfileImage(file);

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
                    // Save as character image
                    try {
                        const charResponse = await axiosInstance.post("/profile/character-image", {
                            imageUrl: result.data.url,
                            isAnimated: false,
                            isVideo: false,
                        });
                        if (charResponse.data.success) {
                            toast.success("Character image updated!");
                            queryClient.invalidateQueries({ queryKey: ["auth"] });
                            setIsOpen(false);
                        } else {
                            toast.error(charResponse.data.message || "Failed to update character image");
                        }
                    } catch {
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

    // Handle remove profile image (revert to Google image)
    const handleRemove = () => {
        setPendingAction("remove");
        updateImage({ imageType: "google" });
    };

    // Handle remove character image
    const { mutate: deleteCharacterImage, isPending: isDeletingCharacter } = useMutation({
        mutationFn: () => axiosInstance.delete("/profile/character-image"),
        onSuccess: () => {
            toast.success("Character image removed!");
            queryClient.invalidateQueries({ queryKey: ["profile-image-settings"] });
            queryClient.invalidateQueries({ queryKey: ["auth"] });
            setPendingAction(null);
        },
        onError: () => {
            toast.error("Failed to remove character image");
            setPendingAction(null);
        },
    });

    const handleRemoveCharacter = () => {
        setPendingAction("removeCharacter");
        deleteCharacterImage();
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

    const isProcessing = isPending || isUploading || isCompressing || isConvertingGif || isDeletingCharacter;

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
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto max-w-md mx-auto">
                    <SheetHeader className="text-center pb-2">
                        <SheetTitle>Profile Picture</SheetTitle>
                        <SheetDescription>
                            Choose how you want to change your profile picture
                        </SheetDescription>
                    </SheetHeader>

                    <div className="pt-2 pb-6 space-y-2">
                        {/* Profile Image option */}
                        <div className="w-full flex items-center rounded-xl border border-muted">
                            <button
                                onClick={() => {
                                    setUploadTargetType("profile");
                                    setTimeout(() => fileInputRef.current?.click(), 50);
                                }}
                                disabled={isProcessing}
                                className="flex items-center gap-4 p-4 flex-1 hover:opacity-80 transition-opacity disabled:opacity-50"
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
                            {settings?.imageType === "uploaded" && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                                    disabled={isProcessing}
                                    className="p-2 rounded-full hover:bg-red-500/10 transition-colors mr-2"
                                    title="Remove profile image"
                                >
                                    {pendingAction === "remove" ? (
                                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Character Image option - RP Only */}
                        <div className="w-full rounded-xl border border-muted bg-amber-500/[0.02]">
                            {/* Main upload row */}
                            <div className="flex items-center p-4">
                                <button
                                    onClick={() => {
                                        if (!hasRoyalPass) {
                                            setIsRedirecting(true);
                                            setTimeout(() => {
                                                router.push("/royal-pass?highlight=character");
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
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center shrink-0">
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
                                {settings?.hasCharacterImage && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(); }}
                                        disabled={isProcessing || isDeletingCharacter}
                                        className="p-2 rounded-full hover:bg-red-500/10 transition-colors ml-auto shrink-0"
                                        title="Remove character image"
                                    >
                                        {pendingAction === "removeCharacter" ? (
                                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        )}
                                    </button>
                                )}
                            </div>
                            {/* AI Prompt tools - integrated row */}
                            <div className="flex items-center justify-end gap-2 px-4 pb-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsRegenerating(true);
                                        setPromptData(generateRandomPrompt());
                                        setIsCopied(false);
                                        setTimeout(() => setIsRegenerating(false), 300);
                                    }}
                                    className="p-1 px-2.5 h-8 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors flex items-center gap-2 group"
                                    title="Generate new AI prompt"
                                >
                                    <RefreshCw className={cn(
                                        "w-3.5 h-3.5 text-purple-600 transition-transform",
                                        isRegenerating && "animate-spin"
                                    )} />
                                    <span className="text-[10px] font-medium text-purple-600">New Prompt</span>
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
                    </div>
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
