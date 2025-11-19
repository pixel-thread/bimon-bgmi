"use client";

import React, { useState, useRef, useEffect } from "react";
import { CharacterAvatar } from "./character-avatar";
import { Button } from "./button";
import { Upload, X, Image } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { PLAYER_ENDPOINTS } from "@/src/lib/endpoints/player";

export interface CharacterImageUploadProps {
  disabled?: boolean;
  className?: string;
}

export function CharacterImageUpload({
  disabled = false,
  className,
}: CharacterImageUploadProps) {
  const { user, refreshAuth } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerId = user?.player?.id || "";
  // Clear preview when currentImageBase64 updates (after successful upload)

  const { mutate, isPending: uploading } = useMutation({
    mutationFn: async (file: File | undefined) =>
      http.post(
        PLAYER_ENDPOINTS.POST_UPLOAD_CHARACTER_IMAGE.replace(":id", playerId),
        { image: file },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      ),
    onSuccess: async (data) => {
      if (data.success) {
        refreshAuth();
        toast.success(data.message);
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: async () =>
      http.delete(PLAYER_ENDPOINTS.DELETE_UPLOAD_CHARACTER_IMAGE),
    onSuccess: async (data) => {
      if (data.success) {
        refreshAuth();
        toast.success(data.message);
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const characterImageUrl = user?.player?.characterImage?.publicUrl;

  const isDisabled =
    !user?.player?.characterImage?.publicUrl ||
    isDeleting ||
    disabled ||
    uploading;

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative group">
        <CharacterAvatar
          src={characterImageUrl}
          size="xl"
          className="border-4 border-white shadow-lg"
        />

        {/* Upload overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
            uploading && "opacity-100"
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
          onChange={(e) => {
            e.preventDefault();
            mutate(e.target.files?.[0]);
          }}
          disabled={!isDisabled}
          className="absolute opacity-0 inset-0 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Upload character image"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          disabled={!isDisabled}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            remove();
          }}
          disabled={isDisabled}
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
