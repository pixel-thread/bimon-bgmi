import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import http from "@/src/utils/http";

type UploadResult = {
    url: string;
    thumbnailUrl: string;
};

type UseImageUploadOptions = {
    onSuccess?: (result: UploadResult) => void;
    onError?: (error: string) => void;
    maxSizeMB?: number; // Max file size in MB (default 5MB)
};

/**
 * Hook for uploading images to ImgBB
 * 
 * Usage:
 * ```tsx
 * const { upload, isUploading, error } = useImageUpload({
 *     onSuccess: (result) => console.log("Uploaded:", result.url),
 * });
 * 
 * // In file input handler:
 * const handleFileChange = (e) => {
 *     const file = e.target.files?.[0];
 *     if (file) upload(file);
 * };
 * ```
 */
export function useImageUpload(options: UseImageUploadOptions = {}) {
    const { onSuccess, onError, maxSizeMB = 5 } = options;
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async (file: File): Promise<UploadResult> => {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                throw new Error("Please select an image file");
            }

            // Validate file size
            const maxBytes = maxSizeMB * 1024 * 1024;
            if (file.size > maxBytes) {
                throw new Error(`Image must be smaller than ${maxSizeMB}MB`);
            }

            // Create form data
            const formData = new FormData();
            formData.append("image", file);

            // Upload via our API
            const response = await http.post<UploadResult>("/upload/image", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (!response.success || !response.data) {
                throw new Error(response.message || "Upload failed");
            }

            return response.data;
        },
        onSuccess: (result) => {
            setError(null);
            onSuccess?.(result);
        },
        onError: (err: Error) => {
            const errorMessage = err.message || "Failed to upload image";
            setError(errorMessage);
            onError?.(errorMessage);
        },
    });

    return {
        upload: mutation.mutate,
        uploadAsync: mutation.mutateAsync,
        isUploading: mutation.isPending,
        error,
        reset: () => {
            setError(null);
            mutation.reset();
        },
    };
}

/**
 * Convert a File to base64 string
 * Useful for previewing before upload
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}
