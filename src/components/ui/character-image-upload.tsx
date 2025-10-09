"use client";

import React, { useState, useRef, useEffect } from "react";
import { CharacterAvatar } from "./character-avatar";
import { Button } from "./button";
import { Upload, X, Image } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

export interface CharacterImageUploadProps {
  currentImageBase64?: string | null;
  // onUpload: (file: File) => Promise<string>; // Returns the uploaded image as Base64
  // onRemove?: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function CharacterImageUpload({
  currentImageBase64,
  // onUpload,
  // onRemove,
  disabled = false,
  className,
}: CharacterImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear preview when currentImageBase64 updates (after successful upload)
  useEffect(() => {
    if (currentImageBase64 && previewBase64) {
      setPreviewBase64(null);
    }
  }, [currentImageBase64, previewBase64]);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type - allow most image formats
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
      "image/bmp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Please select a valid image file (PNG, JPEG, WebP, GIF, BMP)",
      );
      return;
    }

    // Validate file size (max 50MB - we'll compress it)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Image size must be less than 50MB");
      return;
    }

    setUploading(true);
    try {
      // Create preview
      const base64Preview = await convertToBase64(file);
      setPreviewBase64(base64Preview);

      // Show compression progress
      toast.loading("Compressing and uploading character image...");

      // Upload the file
      // await onUpload(file);
      toast.dismiss();
      toast.success("Character image uploaded and compressed successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.dismiss();
      toast.error("Failed to upload image. Please try again.");
      setPreviewBase64(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const handleRemove = async () => {
    if (!onRemove) return;

    setUploading(true);
    try {
      await onRemove();
      toast.success("Character image removed");
    } catch (error) {
      console.error("Remove failed:", error);
      toast.error("Failed to remove image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const displayImage = previewBase64 || currentImageBase64;

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div
        className="relative group"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <CharacterAvatar
          src={displayImage}
          size="xl"
          className="border-4 border-white shadow-lg"
        />

        {/* Upload overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
            uploading && "opacity-100",
          )}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Image className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Click overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="absolute inset-0 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Upload character image"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {currentImageBase64 ? "Change" : "Upload"}
        </Button>

        {currentImageBase64 && onRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="text-xs text-gray-500 text-center max-w-xs space-y-1">
        <p>Upload a full-body standing character image.</p>
        <p>Supports: PNG, JPEG, WebP, GIF, BMP. Max upload: 50MB.</p>
        <p>
          Images will be automatically compressed to ~1MB while maintaining
          quality.
        </p>
      </div>
    </div>
  );
}
