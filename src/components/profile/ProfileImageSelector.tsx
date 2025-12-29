"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Camera, Check, Loader2, User } from "lucide-react";
import Image from "next/image";

type ProfileImage = {
    id: string;
    name: string;
    publicUrl: string;
};

type ImageSettings = {
    imageType: "google" | "none" | "custom";
    customImageId: string | null;
    customImage: ProfileImage | null;
};

export function ProfileImageSelector() {
    const { user: clerkUser } = useUser();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<"google" | "none" | "custom">("google");
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

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
        mutationFn: (data: { imageType: string; customImageId?: string }) =>
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
    const handleOpenChange = (open: boolean) => {
        if (open && settings) {
            setSelectedType(settings.imageType);
            setSelectedImageId(settings.customImageId);
        }
        setIsOpen(open);
    };

    const handleSave = () => {
        if (selectedType === "custom" && !selectedImageId) {
            toast.error("Please select an image");
            return;
        }
        updateImage({
            imageType: selectedType,
            ...(selectedType === "custom" && { customImageId: selectedImageId! }),
        });
    };

    // Determine current display
    const getCurrentImageDisplay = () => {
        if (settingsLoading) {
            return <Skeleton className="h-16 w-16 rounded-full" />;
        }

        if (settings?.imageType === "none") {
            return (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    <User className="h-8 w-8" />
                </div>
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
                                {settings?.imageType === "none" && "No Image"}
                                {settings?.imageType === "custom" && "Custom Image"}
                                {!settings && "Loading..."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {settings?.imageType === "google" && "Using your Google profile picture"}
                                {settings?.imageType === "none" && "Showing initials instead"}
                                {settings?.imageType === "custom" && "Using a custom uploaded image"}
                            </p>
                        </div>

                        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="shrink-0">
                                    Change
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Choose Profile Image</DialogTitle>
                                    <DialogDescription>
                                        Select how you want your profile picture to appear
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
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

                                        {/* No Image Option */}
                                        <div className="flex items-center space-x-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                            <RadioGroupItem value="none" id="none" />
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <Label htmlFor="none" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">No Image</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Show your initials instead
                                                    </p>
                                                </Label>
                                            </div>
                                        </div>

                                        {/* Custom Image Option */}
                                        <div className="rounded-lg border p-4">
                                            <div className="flex items-center space-x-4 hover:bg-muted/50 transition-colors -m-4 p-4 mb-0">
                                                <RadioGroupItem value="custom" id="custom" />
                                                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">Custom Image</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Choose from uploaded images
                                                    </p>
                                                </Label>
                                            </div>

                                            {selectedType === "custom" && (
                                                <div className="mt-4 pt-4 border-t">
                                                    {imagesLoading ? (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {[...Array(4)].map((_, i) => (
                                                                <Skeleton key={i} className="aspect-square rounded-lg" />
                                                            ))}
                                                        </div>
                                                    ) : availableImages.length === 0 ? (
                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                            No custom images available yet
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {availableImages.map((img) => (
                                                                <button
                                                                    key={img.id}
                                                                    onClick={() => setSelectedImageId(img.id)}
                                                                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageId === img.id
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
                                                                    {selectedImageId === img.id && (
                                                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                                            <Check className="h-6 w-6 text-primary" />
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </RadioGroup>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsOpen(false)}
                                            disabled={isPending}
                                        >
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSave} disabled={isPending}>
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
