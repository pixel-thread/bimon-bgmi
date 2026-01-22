"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/src/components/ui/dialog";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Skeleton } from "@/src/components/ui/skeleton";
import http from "@/src/utils/http";
import axiosInstance from "@/src/utils/api";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Camera, Check, CloudUpload, Loader2, User } from "lucide-react";
import Image from "next/image";
import { useDialogBackHandler } from "@/src/hooks/useDialogBackHandler";
import { compressProfileImage } from "@/src/utils/image/compressImage";

type ProfileImage = {
    id: string;
    name: string;
    publicUrl: string;
};

type ImageSettings = {
    imageType: "google" | "custom" | "uploaded";
    customImageId: string | null;
    customImage: ProfileImage | null;
    uploadedImageUrl: string | null;
};

export function ProfileImageSelector() {
    const { user: clerkUser } = useUser();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<"google" | "custom" | "uploaded">("google");
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use the back button handler hook
    const handleOpenChangeWithBack = useDialogBackHandler(isOpen, setIsOpen, "profileImage");

    // Fetch current settings
    const { data: settingsData, isLoading: settingsLoading } = useQuery({
        queryKey: ["profile-image-settings"],
        queryFn: () => http.get<ImageSettings>("/profile/image"),
    });

    // Fetch available profile images
    const { data: imagesData, isLoading: imagesLoading } = useQuery({
        queryKey: ["profile-images"],
        queryFn: () => http.get<ProfileImage[]>("/profile/images"),
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
            } else {
                toast.error(response.message || "Failed to update image");
            }
        },
        onError: () => toast.error("Failed to update profile image"),
    });

    // Sync local state with settings when dialog opens
    const handleOpenChange = useCallback((open: boolean) => {
        if (open && settings) {
            setSelectedType(settings.imageType);
            setSelectedImageId(settings.customImageId);
            setUploadedUrl(settings.uploadedImageUrl);
        }
        handleOpenChangeWithBack(open);
    }, [settings, handleOpenChangeWithBack]);

    // Handle file upload - now uses ImgBB
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

            const response = await axiosInstance.post("/api/upload/image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const result = response.data;

            if (result.success && result.data?.url) {
                setUploadedUrl(result.data.url);
                setSelectedType("uploaded");
                toast.success("Image uploaded successfully!");
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

    const handleSave = () => {
        if (selectedType === "custom" && !selectedImageId) {
            toast.error("Please select an image");
            return;
        }
        if (selectedType === "uploaded" && !uploadedUrl) {
            toast.error("Please upload an image first");
            return;
        }
        updateImage({
            imageType: selectedType,
            ...(selectedType === "custom" && { customImageId: selectedImageId! }),
            ...(selectedType === "uploaded" && { uploadedImageUrl: uploadedUrl! }),
        });
    };

    // Determine current display
    const getCurrentImageDisplay = () => {
        if (settingsLoading) {
            return <Skeleton className="h-16 w-16 rounded-full" />;
        }

        if (settings?.imageType === "uploaded" && settings.uploadedImageUrl) {
            return (
                <Image
                    src={settings.uploadedImageUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                    unoptimized
                />
            );
        }

        if (settings?.imageType === "custom" && settings.customImage) {
            return (
                <Image
                    src={settings.customImage.publicUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                />
            );
        }

        // Default: Google image
        if (clerkUser?.imageUrl) {
            return (
                <Image
                    src={clerkUser.imageUrl}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="h-16 w-16 rounded-full object-cover"
                />
            );
        }

        return (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
            </div>
        );
    };

    const isProcessing = isPending || isUploading || isCompressing;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Profile Image
                </CardTitle>
                <CardDescription>
                    Choose how your profile image is displayed
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Image */}
                    <div className="shrink-0">
                        {getCurrentImageDisplay()}
                    </div>

                    {/* Info and button */}
                    <div className="flex-1 flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-3 text-center sm:text-left w-full">
                        <div className="min-w-0">
                            <p className="font-medium">
                                {settings?.imageType === "google" && "Google Account"}
                                {settings?.imageType === "custom" && "Custom Image"}
                                {settings?.imageType === "uploaded" && "Your Upload"}
                                {!settings && "Loading..."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {settings?.imageType === "google" && "Using your Google profile picture"}
                                {settings?.imageType === "custom" && "Using a custom uploaded image"}
                                {settings?.imageType === "uploaded" && "Using your uploaded image"}
                            </p>
                        </div>

                        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0">
                                    Change
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
                                <DialogHeader>
                                    <DialogTitle>Choose Profile Image</DialogTitle>
                                    <DialogDescription>
                                        Select how you want your profile picture to appear
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4 overflow-y-auto flex-1">
                                    <RadioGroup
                                        value={selectedType}
                                        onValueChange={(v) => setSelectedType(v as typeof selectedType)}
                                        className="space-y-4"
                                    >
                                        {/* Google Option */}
                                        <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value="google" id="google" />
                                            <div className="flex items-center gap-3 flex-1">
                                                {clerkUser?.imageUrl ? (
                                                    <Image
                                                        src={clerkUser.imageUrl}
                                                        alt="Google"
                                                        width={40}
                                                        height={40}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                )}
                                                <Label htmlFor="google" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">Google Account Image</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Use your Google profile picture
                                                    </p>
                                                </Label>
                                            </div>
                                        </div>

                                        {/* Upload Your Own Option */}
                                        <div className="rounded-lg border p-4">
                                            <div className="flex items-center space-x-4 hover:bg-muted/50 transition-colors -m-4 p-4 mb-0">
                                                <RadioGroupItem value="uploaded" id="uploaded" />
                                                <Label htmlFor="uploaded" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">Upload Your Own</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Upload a custom image
                                                    </p>
                                                </Label>
                                            </div>

                                            <div className="mt-4 pt-4 border-t">
                                                <div className="space-y-3">
                                                    {/* Show uploaded image preview */}
                                                    {uploadedUrl && (
                                                        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                                                            <Image
                                                                src={uploadedUrl}
                                                                alt="Uploaded"
                                                                width={48}
                                                                height={48}
                                                                className="h-12 w-12 rounded-full object-cover"
                                                                unoptimized
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium">Your uploaded image</p>
                                                                <p className="text-xs text-muted-foreground">Ready to use</p>
                                                            </div>
                                                            {selectedType === "uploaded" && (
                                                                <Check className="h-5 w-5 text-primary" />
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Upload button */}
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileSelect}
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isProcessing}
                                                    >
                                                        {isCompressing ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Compressing...
                                                            </>
                                                        ) : isUploading ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CloudUpload className="h-4 w-4 mr-2" />
                                                                {uploadedUrl ? "Change Image" : "Upload Image"}
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Custom Image Option (Gallery) */}
                                        {availableImages.length > 0 && (
                                            <div className="rounded-lg border p-4">
                                                <div className="flex items-center space-x-4 hover:bg-muted/50 transition-colors -m-4 p-4 mb-0">
                                                    <RadioGroupItem value="custom" id="custom" />
                                                    <Label htmlFor="custom" className="flex-1 cursor-pointer">
                                                        <p className="font-medium">Choose from Gallery</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Select from available images
                                                        </p>
                                                    </Label>
                                                </div>

                                                {/* Always show images - clicking one auto-selects custom */}
                                                <div className="mt-4 pt-4 border-t">
                                                    {imagesLoading ? (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {[...Array(4)].map((_, i) => (
                                                                <Skeleton key={i} className="aspect-square rounded-lg" />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {availableImages.map((img) => (
                                                                <button
                                                                    key={img.id}
                                                                    onClick={() => {
                                                                        setSelectedImageId(img.id);
                                                                        setSelectedType("custom"); // Auto-select custom when clicking an image
                                                                    }}
                                                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageId === img.id && selectedType === "custom"
                                                                        ? "border-primary ring-2 ring-primary/20"
                                                                        : "border-transparent hover:border-muted-foreground/25"
                                                                        }`}
                                                                >
                                                                    <Image
                                                                        src={img.publicUrl}
                                                                        alt={img.name}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                    {selectedImageId === img.id && selectedType === "custom" && (
                                                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                                            <Check className="h-6 w-6 text-primary" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </RadioGroup>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsOpen(false)}
                                            disabled={isProcessing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={
                                                isProcessing ||
                                                (selectedType === settings?.imageType &&
                                                    (selectedType === "google" ||
                                                        (selectedType === "custom" && selectedImageId === settings?.customImageId) ||
                                                        (selectedType === "uploaded" && uploadedUrl === settings?.uploadedImageUrl)))
                                            }
                                        >
                                            {isPending ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                "Save"
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
