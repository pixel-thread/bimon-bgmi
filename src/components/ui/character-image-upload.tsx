"use client";

import React, { useState, useRef, useEffect } from "react";
import { CharacterAvatar } from "./character-avatar";
import { Button } from "./button";
import { Upload, X, Image } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/useAuth";

export interface CharacterImageUploadProps {
  currentImageBase64?: string | null;
  // onUpload: (file: File) => Promise<string>; // Returns the uploaded image as Base64
  // onRemove?: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function CharacterImageUpload({
  disabled = false,
  className,
}: CharacterImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear preview when currentImageBase64 updates (after successful upload)
  const { mutate } = useMutation({
    mutationFn: async (file: File | undefined) =>
      http.post(
        `/player/${user?.player?.id}/character`,
        { image: file },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      ),
  });

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative group">
        <CharacterAvatar
          src={user?.player?.characterImage?.publicUrl}
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
        <input
          type="file"
          onChange={(e) => mutate(e.target.files?.[0])}
          disabled={disabled || uploading}
          className="absolute  inset-0 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          className="flex items-center gap-2 text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
          Remove
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
