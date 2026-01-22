import { useState, useCallback } from "react";
import http from "@/src/utils/http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DriveStatus {
    connected: boolean;
}

interface UploadResult {
    success: boolean;
    url: string;
    fileId: string;
}

interface AuthUrlResult {
    authUrl: string;
}

/**
 * Hook for Google Drive image uploads
 * Handles connection status, authentication, and file uploads
 */
export function useGoogleDrive() {
    const queryClient = useQueryClient();
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // Check if Drive is connected
    const { data: statusData, isLoading: isCheckingStatus } = useQuery({
        queryKey: ["google-drive-status"],
        queryFn: () => http.get<DriveStatus>("/drive/upload"),
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const isConnected = statusData?.data?.connected ?? false;

    // Get auth URL for connecting Drive
    const { mutateAsync: getAuthUrl, isPending: isGettingAuthUrl } = useMutation({
        mutationFn: async () => {
            const response = await http.get<AuthUrlResult>("/auth/google-drive");
            return response.data;
        },
    });

    // Connect to Google Drive (opens auth popup)
    const connectDrive = useCallback(async () => {
        try {
            const result = await getAuthUrl();
            if (result?.authUrl) {
                // Open auth URL in popup or redirect
                window.location.href = result.authUrl;
            }
        } catch (error) {
            console.error("Failed to get auth URL:", error);
            toast.error("Failed to initiate Google Drive connection");
        }
    }, [getAuthUrl]);

    // Upload mutation
    const { mutateAsync: uploadFile, isPending: isUploading } = useMutation({
        mutationFn: async (file: File): Promise<UploadResult | null> => {
            setUploadProgress(0);

            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await fetch("/api/drive/upload", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                if (!response.ok) {
                    if (data.needsAuth) {
                        toast.error("Please connect your Google Drive first");
                        return null;
                    }
                    throw new Error(data.error || "Upload failed");
                }

                setUploadProgress(100);
                return data;
            } catch (error) {
                console.error("Upload error:", error);
                throw error;
            } finally {
                setTimeout(() => setUploadProgress(null), 1000);
            }
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Failed to upload image");
        },
    });

    // Upload helper that handles errors gracefully
    const uploadImage = useCallback(
        async (file: File): Promise<string | null> => {
            if (!isConnected) {
                toast.error("Please connect your Google Drive first");
                return null;
            }

            const result = await uploadFile(file);
            return result?.url ?? null;
        },
        [isConnected, uploadFile]
    );

    // Invalidate status after connecting
    const refreshStatus = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["google-drive-status"] });
    }, [queryClient]);

    return {
        isConnected,
        isCheckingStatus,
        isUploading,
        isGettingAuthUrl,
        uploadProgress,
        connectDrive,
        uploadImage,
        refreshStatus,
    };
}
