"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { toast } from "sonner";
import { Volume2, Upload, Trash2, Play, AlertCircle, Check } from "lucide-react";

interface NotificationSoundData {
    hasCustomSound: boolean;
    fileName: string | null;
    url: string | null;
}

export function NotificationSoundSettings() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Fetch current sound status
    const { data, isLoading } = useQuery({
        queryKey: ["notification-sound"],
        queryFn: () => http.get<NotificationSoundData>("/admin/settings/notification-sound"),
    });

    // Upload mutation
    const { mutate: uploadSound, isPending: isUploading } = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);
            return http.post("/admin/settings/notification-sound", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        },
        onSuccess: () => {
            toast.success("Notification sound uploaded");
            queryClient.invalidateQueries({ queryKey: ["notification-sound"] });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to upload sound");
        },
    });

    // Delete mutation
    const { mutate: deleteSound, isPending: isDeleting } = useMutation({
        mutationFn: () => http.delete("/admin/settings/notification-sound"),
        onSuccess: () => {
            toast.success("Notification sound deleted");
            queryClient.invalidateQueries({ queryKey: ["notification-sound"] });
        },
        onError: () => {
            toast.error("Failed to delete sound");
        },
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadSound(file);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handlePlayPreview = () => {
        if (audioRef.current && data?.data?.url) {
            if (isPlaying) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const soundData = data?.data;

    return (
        <Card className="border bg-card">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                        <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Notification Sound</CardTitle>
                        <CardDescription>
                            Upload a custom sound for push notifications (Android only)
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Info Alert */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        Custom notification sounds only work on <strong>Android devices</strong>.
                        iOS and desktop browsers will use the default system sound.
                    </p>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                ) : (
                    <>
                        {/* Current Status */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border">
                            <div className="flex items-center gap-2">
                                {soundData?.hasCustomSound ? (
                                    <>
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Custom sound active</p>
                                            <p className="text-xs text-muted-foreground">{soundData.fileName}</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                            <Volume2 className="h-4 w-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Using default sound</p>
                                            <p className="text-xs text-muted-foreground">Upload a custom sound file</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {soundData?.hasCustomSound && soundData.url && (
                                <div className="flex items-center gap-2">
                                    <audio
                                        ref={audioRef}
                                        src={soundData.url}
                                        onEnded={() => setIsPlaying(false)}
                                        preload="none"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePlayPreview}
                                        className="h-8"
                                    >
                                        <Play className={`h-3.5 w-3.5 mr-1 ${isPlaying ? "text-emerald-500" : ""}`} />
                                        {isPlaying ? "Stop" : "Preview"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteSound()}
                                        disabled={isDeleting}
                                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Upload Button */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="w-full sm:w-auto"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploading ? "Uploading..." : soundData?.hasCustomSound ? "Replace Sound" : "Upload Sound"}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Supported formats: MP3, WAV, OGG (max 5MB)
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
