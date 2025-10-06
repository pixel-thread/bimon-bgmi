"use client";

import React, { useState, useRef, useEffect } from "react";
import { Avatar } from "./avatar";
import { Button } from "./button";
import { Camera, Upload, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";

export interface ProfilePictureUploadProps {
  currentAvatarUrl?: string | null;
  onUpload: (file: File) => Promise<string>; // Returns the uploaded image URL
  onRemove?: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function ProfilePictureUpload({
  currentAvatarUrl,
  onUpload,
  onRemove,
  disabled = false,
  className,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear preview when currentAvatarUrl updates (after successful upload)
  useEffect(() => {
    if (currentAvatarUrl && previewUrl) {
      setPreviewUrl(null);
    }
  }, [currentAvatarUrl, previewUrl]);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 50MB - we'll compress it)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Image size must be less than 50MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Show compression progress
      toast.loading("Compressing and uploading image...");
      await onUpload(file);
      // Don't clear preview immediately - let the parent component update currentAvatarUrl first
      // The preview will be replaced by the actual URL when currentAvatarUrl updates
      toast.dismiss();
      toast.success("Profile picture updated and compressed successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.dismiss();
      toast.error("Failed to upload image. Please try again.");
      setPreviewUrl(null);
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
      toast.success("Profile picture removed");
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

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div
        className="relative group"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Avatar
          src={displayUrl}
          size="xl"
          className="w-24 h-24 border-4 border-white shadow-lg"
        />

        {/* Upload overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
            uploading && "opacity-100"
          )}
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>

        {/* Click overlay */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="absolute inset-0 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Upload profile picture"
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
          {currentAvatarUrl ? "Change" : "Upload"}
        </Button>

        {currentAvatarUrl && onRemove && (
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

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Upload a profile picture. Supported formats: JPG, PNG, GIF, WebP, BMP.
        Images will be automatically compressed to ~1MB while maintaining
        quality.
      </p>
    </div>
  );
}
