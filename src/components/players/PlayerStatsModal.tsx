"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { CategoryBadge } from "@/src/components/ui/category-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { History, Ban, AlertTriangle, CheckCircle, DollarSign, ArrowUpRight, Shield, Heart, User, Crown, Loader2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { usePlayer } from "@/src/hooks/player/usePlayer";
import { usePlayerStats } from "@/src/hooks/player/usePlayerStats";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { UCTransferDialog } from "./UCTransferDialog";


import { getDisplayName } from "@/src/utils/displayName";
import { getKdRank } from "@/src/utils/categoryUtils";

function ModalSkeleton() {
  return (
    <div className="space-y-5 sm:space-y-8 py-2">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {/* Matches */}
        <div className="text-center p-4 sm:p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
          <div className="h-7 sm:h-9 w-12 sm:w-16 bg-blue-200/60 dark:bg-blue-700/40 rounded-md mx-auto mb-2.5 animate-pulse" />
          <div className="h-3.5 sm:h-4 w-14 sm:w-18 bg-blue-100 dark:bg-blue-800/30 rounded mx-auto animate-pulse" />
        </div>
        {/* Kills */}
        <div className="text-center p-4 sm:p-5 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
          <div className="h-7 sm:h-9 w-12 sm:w-16 bg-green-200/60 dark:bg-green-700/40 rounded-md mx-auto mb-2.5 animate-pulse" />
          <div className="h-3.5 sm:h-4 w-12 sm:w-14 bg-green-100 dark:bg-green-800/30 rounded mx-auto animate-pulse" />
        </div>
        {/* K/D */}
        <div className="text-center p-4 sm:p-5 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
          <div className="h-7 sm:h-9 w-10 sm:w-14 bg-yellow-200/60 dark:bg-yellow-700/40 rounded-md mx-auto mb-2.5 animate-pulse" />
          <div className="h-3.5 sm:h-4 w-10 sm:w-12 bg-yellow-100 dark:bg-yellow-800/30 rounded mx-auto animate-pulse" />
        </div>
        {/* Balance */}
        <div className="text-center p-4 sm:p-5 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
          <div className="h-7 sm:h-9 w-16 sm:w-22 bg-purple-200/60 dark:bg-purple-700/40 rounded-md mx-auto mb-2.5 animate-pulse" />
          <div className="h-3.5 sm:h-4 w-14 sm:w-16 bg-purple-100 dark:bg-purple-800/30 rounded mx-auto animate-pulse" />
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex justify-center pt-1">
        <div className="h-9 sm:h-10 w-32 sm:w-36 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

type InitialPlayerData = {
  id: string;
  isBanned: boolean;
  userName: string;
  displayName?: string | null;
  category: string;
  kd: number;
  kills: number;
  matches: number;
  deaths: number;
  imageUrl?: string | null;
  profileImageUrl?: string | null;
  characterImageUrl?: string | null;
  isAnimated?: boolean;
  isVideo?: boolean;
  thumbnailUrl?: string | null;
  balance?: number;
  hasRoyalPass?: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id: string;
  initialData?: InitialPlayerData;
};

export function PlayerStatsModal({ isOpen, onClose, id, initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isOwnProfile = user?.playerId === id;

  // Always fetch individual player data when modal opens
  // This ensures we get the real video URL, not the thumbnail from the list API
  // (The list API sends thumbnails for positions >= 3 to reduce bandwidth)
  const { data: player, isLoading: isPlayerLoading } = usePlayer({
    id,
    enabled: isOpen
  });

  // Use initialData if available for instant display (it includes accurate matches from players list)
  const hasInitialData = !!initialData;
  const isLoading = !hasInitialData && isPlayerLoading;

  // Derived display values - use initialData for instant AND accurate display
  // Circle avatars: customProfileImageUrl > Clerk image (no character image)
  const displayName = player?.user?.displayName || player?.user?.userName || initialData?.displayName || initialData?.userName || "Player";
  const displayImageUrl = initialData?.profileImageUrl || (player as any)?.customProfileImageUrl || player?.clerkImageUrl || initialData?.imageUrl;

  // Character image/video data (for 9:16 preview)
  // IMPORTANT: Prefer fetched player data over initialData for character images
  // because the list API sends thumbnails for positions >= 3 to save bandwidth
  // The individual player API returns the actual video URL
  const characterImageUrl = (player as any)?.characterImage?.publicUrl || initialData?.characterImageUrl;
  const isVideo = (player as any)?.characterImage?.isVideo || initialData?.isVideo;
  const isAnimated = (player as any)?.characterImage?.isAnimated || initialData?.isAnimated;
  const thumbnailUrl = (player as any)?.characterImage?.thumbnailUrl || initialData?.thumbnailUrl;

  // Stats from initialData (already accurate from players list API)
  const displayDeaths = initialData?.deaths ?? 0;
  const displayKills = initialData?.kills ?? 0;
  const displayKd = initialData?.kd ?? 0;
  const displayCategory = initialData?.category || player?.category || "BRONZE";

  // For player data - can use fetched as it has more details
  const displayIsBanned = player?.isBanned ?? initialData?.isBanned ?? false;
  const displayBalance = player?.uc?.balance ?? initialData?.balance ?? 0;

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0 });
  const avatarRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // 🐍 RKO Easter egg
  const rkoAudioRef = useRef<HTMLAudioElement | null>(null);
  const [rkoMuted, setRkoMuted] = useState(true);
  const isRkoPlayer = (player?.user?.userName || initialData?.userName)?.toLowerCase() === "badsnipe";

  useEffect(() => {
    if (isOpen && isRkoPlayer) {
      if (!rkoAudioRef.current) {
        rkoAudioRef.current = new Audio("/audio/rko.mp3");
        rkoAudioRef.current.loop = false;
        rkoAudioRef.current.onended = () => {
          setRkoMuted(true);
        };
      }
      rkoAudioRef.current.muted = true;
      rkoAudioRef.current.currentTime = 0;
      rkoAudioRef.current.play().catch(() => { });
      setRkoMuted(true);
    } else {
      if (rkoAudioRef.current) {
        rkoAudioRef.current.pause();
        rkoAudioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (rkoAudioRef.current) {
        rkoAudioRef.current.pause();
        rkoAudioRef.current.currentTime = 0;
      }
    };
  }, [isOpen, isRkoPlayer]);

  const toggleRkoMute = useCallback(() => {
    if (!rkoAudioRef.current) return;
    const next = !rkoMuted;
    setRkoMuted(next);
    rkoAudioRef.current.muted = next;
    if (!next) {
      // Unmuting — restart from beginning so user hears full clip
      rkoAudioRef.current.currentTime = 0;
      rkoAudioRef.current.play().catch(() => { });
    }
  }, [rkoMuted]);

  // Key to trigger video replay when modal opens
  const [videoKey, setVideoKey] = useState(0);
  React.useEffect(() => {
    if (isOpen && isVideo) {
      setVideoReady(false);
      setVideoKey(prev => prev + 1);
    }
    if (!isOpen) {
      setVideoReady(false);
    }
  }, [isOpen, isVideo]);

  // Reset image preview when modal closes or player changes
  React.useEffect(() => {
    if (!isOpen) {
      setIsImagePreviewOpen(false);
    }
  }, [isOpen, id]);

  // Global click listener to close image preview when clicking anywhere except on the image
  const imagePreviewRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isImagePreviewOpen) return;

    const handleGlobalClick = (e: MouseEvent) => {
      // If click is on the preview image itself, let the onClick handler deal with it
      if (imagePreviewRef.current && imagePreviewRef.current.contains(e.target as Node)) {
        return;
      }
      // Close preview on any other click
      setIsImagePreviewOpen(false);
    };

    // Use capture phase to catch the click before other handlers
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [isImagePreviewOpen]);

  const handleAvatarClick = () => {
    // Use displayImageUrl which already falls back to initialData for non-admins
    if (displayImageUrl && avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Calculate offset from screen center
      const offsetX = centerX - window.innerWidth / 2;
      const offsetY = centerY - window.innerHeight / 2;
      setAvatarPosition({ x: offsetX, y: offsetY });
      setIsImagePreviewOpen(true);
    }
  };

  const { mutate: toggleBan, isPending: isBanPending } = useMutation({
    mutationFn: () =>
      http.post(
        ADMIN_PLAYER_ENDPOINTS.POST_TOGGLE_BANNED.replace(":id", id),
        {}
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Player ban status updated");
        queryClient.invalidateQueries({ queryKey: ["player", id] });
        queryClient.invalidateQueries({ queryKey: ["players"] });
      } else {
        toast.error(data.message || "Failed to update ban status");
      }
    },
    onError: () => {
      toast.error("Failed to update ban status");
    },
  });

  const { mutate: toggleUCExemption, isPending: isExemptionPending } = useMutation({
    mutationFn: (isUCExempt: boolean) =>
      http.patch(
        ADMIN_PLAYER_ENDPOINTS.PATCH_PLAYER.replace(":id", id),
        { isUCExempt }
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "UC exemption status updated");
        queryClient.invalidateQueries({ queryKey: ["player", id] });
        queryClient.invalidateQueries({ queryKey: ["players"] });
      } else {
        toast.error(data.message || "Failed to update exemption status");
      }
    },
    onError: () => {
      toast.error("Failed to update exemption status");
    },
  });

  const { mutate: toggleTrusted, isPending: isTrustedPending } = useMutation({
    mutationFn: (isTrusted: boolean) =>
      http.patch(
        ADMIN_PLAYER_ENDPOINTS.PATCH_PLAYER.replace(":id", id),
        { isTrusted }
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Trusted status updated");
        queryClient.invalidateQueries({ queryKey: ["player", id] });
        queryClient.invalidateQueries({ queryKey: ["players"] });
      } else {
        toast.error(data.message || "Failed to update trusted status");
      }
    },
    onError: () => {
      toast.error("Failed to update trusted status");
    },
  });

  const handleBalanceAdjustment = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("uc", id);
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          // If closing and image preview is open, just close the preview, not the modal
          if (!open && isImagePreviewOpen) {
            setIsImagePreviewOpen(false);
            return;
          }
          if (!open) {
            onClose();
          }
        }}
      >
        <DialogContent
          className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 sm:p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          hideCloseButton
        >
          <div
            className="p-5 sm:p-7"
            style={isRkoPlayer && !rkoMuted ? {
              animation: 'rkoShake 0.15s ease-in-out infinite',
            } : undefined}
          >
            <DialogHeader className="text-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <DialogTitle className="sr-only">Loading player...</DialogTitle>
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                  <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse" />
                  <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                </div>
              ) : (!player && !initialData) ? (
                <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Player Not Found
                </DialogTitle>
              ) : (
                /* Mobile: 2-column grid when character image exists, centered flex when it doesn't, Desktop: centered flex */
                <div className={`${characterImageUrl ? 'grid grid-cols-2' : 'flex justify-center'} md:flex md:justify-center md:items-center gap-4 w-full`}>
                  {/* Character Video/Image */}
                  {(characterImageUrl || (initialData?.hasRoyalPass && isPlayerLoading)) && (
                    <div className="flex justify-center items-center">
                      <div className="relative w-24 sm:w-28 md:w-32 aspect-[9/16] rounded-xl overflow-hidden border-2 border-yellow-400/60 dark:border-yellow-500/60 shadow-lg bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950">
                        {/* Initials + progress bar loader - fades out when video loads */}
                        <div
                          className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-opacity duration-500"
                          style={{ opacity: (!player || isPlayerLoading || (isVideo && !videoReady)) ? 1 : 0 }}
                        >
                          {/* Premium dark gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950" />
                          {/* Glowing initial letter */}
                          <span
                            className="relative z-10 text-5xl font-bold text-yellow-500 animate-pulse"
                            style={{
                              textShadow: '0 0 20px rgba(234, 179, 8, 0.6), 0 0 40px rgba(234, 179, 8, 0.4), 0 0 60px rgba(234, 179, 8, 0.2)'
                            }}
                          >
                            {displayName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                          {/* Progress bar below initials */}
                          <div className="relative z-10 w-3/5">
                            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.8), rgba(251,191,36,1), rgba(234,179,8,0.8), transparent)',
                                  animation: 'charImageShimmer 1.5s ease-in-out infinite',
                                }}
                              />
                            </div>
                          </div>
                          {/* Inline keyframes */}
                          <style jsx>{`
                          @keyframes charImageShimmer {
                            0% { transform: translateX(-100%); }
                            100% { transform: translateX(200%); }
                          }
                        `}</style>
                        </div>

                        {/* Video/Image content - fades in when loaded */}
                        {/* Video/Image content - only render after player data loads so video doesn't autoplay behind loader */}
                        {player && characterImageUrl && (
                          <div
                            className="absolute inset-0 transition-opacity duration-500"
                            style={{ opacity: isVideo ? (videoReady ? 1 : 0) : 1 }}
                          >
                            {isVideo ? (
                              <video
                                key={videoKey}
                                ref={videoRef}
                                src={characterImageUrl}
                                muted
                                playsInline
                                loop={false}
                                poster={thumbnailUrl || undefined}
                                className="absolute inset-0 w-full h-full object-cover"
                                onLoadedData={(e) => {
                                  // Start playback only after buffered, then fade in
                                  setVideoReady(true);
                                  (e.target as HTMLVideoElement).play().catch(() => { });
                                }}
                                onError={(e) => {
                                  console.error('Video failed to load:', characterImageUrl);
                                  (e.target as HTMLVideoElement).style.display = 'none';
                                }}
                              />
                            ) : isAnimated ? (
                              <img
                                key={isOpen ? `gif-${id}` : undefined}
                                src={characterImageUrl}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Animated image failed to load:', characterImageUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <img
                                src={characterImageUrl}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Image failed to load:', characterImageUrl);
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Player Info - Centered in right column */}
                  <div className="flex flex-col justify-center items-center gap-2 text-center">
                    {/* Clickable Avatar */}
                    <div
                      ref={avatarRef}
                      className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleAvatarClick}
                    >
                      {displayImageUrl ? (
                        <img
                          src={displayImageUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-semibold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {displayName?.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {displayIsBanned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/40 rounded-full" />
                          <div className="relative rotate-[-20deg] bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-800 shadow-lg uppercase">
                            Banned
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Name + Crown */}
                    <DialogTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-1.5 w-full">
                      <span
                        style={isRkoPlayer && !rkoMuted ? {
                          animation: 'rkoTextFlash 0.5s ease-in-out infinite',
                          textShadow: '0 0 10px rgba(220, 38, 38, 0.8), 0 0 20px rgba(220, 38, 38, 0.4)',
                        } : undefined}
                      >
                        {displayName}
                      </span>
                      {((player as any)?.hasRoyalPass || initialData?.hasRoyalPass) && (
                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 crown-glow -translate-y-0.5" />
                      )}
                      {isRkoPlayer && (
                        <button
                          onClick={toggleRkoMute}
                          className="ml-1 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          title={rkoMuted ? "Unmute RKO" : "Mute RKO"}
                        >
                          {rkoMuted ? (
                            <VolumeX className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-red-500 animate-pulse" />
                          )}
                        </button>
                      )}
                    </DialogTitle>
                    {/* Category Badge */}
                    <CategoryBadge category={displayCategory} size="sm" />
                    {/* Admin badges */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {displayIsBanned && (
                        <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 text-[10px] px-1.5 py-0">
                          <Ban className="w-2.5 h-2.5 mr-0.5" />
                          BANNED
                        </Badge>
                      )}
                      {isSuperAdmin && player?.isUCExempt && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-[10px] px-1.5 py-0">
                          <Shield className="w-2.5 h-2.5 mr-0.5" />
                          UC EXEMPT
                        </Badge>
                      )}
                      {isSuperAdmin && player?.isTrusted && (
                        <Badge variant="secondary" className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100 text-[10px] px-1.5 py-0">
                          <Heart className="w-2.5 h-2.5 mr-0.5" />
                          TRUSTED
                        </Badge>
                      )}
                    </div>
                    {/* Bio/Message */}
                    {isPlayerLoading && !player ? (
                      <div className="h-4 w-36 bg-zinc-200/60 dark:bg-zinc-700/40 rounded mx-auto animate-pulse" />
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground italic max-w-[200px] text-center mx-auto">
                        "{(player as any)?.bio || `Nga u ${displayName} dei u ${getKdRank(displayKills, displayDeaths).charAt(0).toUpperCase() + getKdRank(displayKills, displayDeaths).slice(1)}`}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </DialogHeader>

            {isLoading ? (
              <ModalSkeleton />
            ) : (!player && !initialData) ? (
              <div className="text-center py-8 text-muted-foreground">
                Player data could not be loaded
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 py-2">
                {/* Stats Grid - 2x2 on mobile, 4x1 on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                  <motion.div
                    animate={isRkoPlayer && !rkoMuted ? {
                      rotate: [0, -8, 4, -2, 0],
                      y: [0, 6, -3, 8, 0],
                      x: [0, -4, 2, -1, 0],
                    } : { rotate: 0, y: 0, x: 0 }}
                    transition={isRkoPlayer && !rkoMuted ? { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 } : { duration: 0.4, ease: 'easeOut' }}
                    className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30"
                  >
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {displayDeaths}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Matches</p>
                  </motion.div>
                  <motion.div
                    animate={isRkoPlayer && !rkoMuted ? {
                      rotate: [0, 6, -10, 3, 0],
                      y: [0, -5, 10, -2, 0],
                      x: [0, 3, -5, 2, 0],
                    } : { rotate: 0, y: 0, x: 0 }}
                    transition={isRkoPlayer && !rkoMuted ? { duration: 0.7, repeat: Infinity, repeatDelay: 0.2, delay: 0.1 } : { duration: 0.4, ease: 'easeOut' }}
                    className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30"
                  >
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {displayKills}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Kills</p>
                  </motion.div>
                  <motion.div
                    animate={isRkoPlayer && !rkoMuted ? {
                      rotate: [0, 10, -6, 8, 0],
                      y: [0, 8, -4, 12, 0],
                      x: [0, -6, 3, -2, 0],
                    } : { rotate: 0, y: 0, x: 0 }}
                    transition={isRkoPlayer && !rkoMuted ? { duration: 0.55, repeat: Infinity, repeatDelay: 0.35, delay: 0.2 } : { duration: 0.4, ease: 'easeOut' }}
                    className="text-center p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30"
                  >
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                      {displayKd.toFixed(2)}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">K/D</p>
                  </motion.div>
                  <motion.div
                    animate={isRkoPlayer && !rkoMuted ? {
                      rotate: [0, -5, 12, -7, 0],
                      y: [0, 10, -6, 4, 0],
                      x: [0, 5, -3, 6, 0],
                    } : { rotate: 0, y: 0, x: 0 }}
                    transition={isRkoPlayer && !rkoMuted ? { duration: 0.65, repeat: Infinity, repeatDelay: 0.15, delay: 0.3 } : { duration: 0.4, ease: 'easeOut' }}
                    className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30"
                  >
                    <p
                      className={`text-xl sm:text-2xl font-bold ${Number(displayBalance) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {Math.floor(Number(displayBalance)).toLocaleString()} UC
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Balance</p>
                  </motion.div>
                </div>


                {player?.isBanned && player?.playerBanned && (
                  <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700 dark:text-red-300" />
                      <h4 className="font-semibold text-sm sm:text-base text-red-800 dark:text-red-200">
                        Ban Information
                      </h4>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      {player?.playerBanned?.banReason && (
                        <div>
                          <span className="font-medium text-red-800 dark:text-red-200">
                            Reason:
                          </span>
                          <span className="ml-1.5 sm:ml-2 text-red-700 dark:text-red-100">
                            {player?.playerBanned?.banReason}
                          </span>
                        </div>
                      )}
                      {player?.playerBanned?.bannedAt && (
                        <div>
                          <span className="font-medium text-red-800 dark:text-red-200">
                            Banned On:
                          </span>
                          <span className="ml-1.5 sm:ml-2 text-red-700 dark:text-red-100">
                            {new Date(player?.playerBanned?.bannedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-red-800 dark:text-red-200">
                          Duration:
                        </span>
                        <span className="ml-1.5 sm:ml-2 text-red-700 dark:text-red-100">
                          {player?.playerBanned?.banDuration} tournament
                          {player?.playerBanned?.banDuration !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2.5 sm:gap-3 pt-1 [&>*:last-child:nth-child(odd)]:col-span-2 [&>*:last-child:nth-child(odd)]:justify-self-center [&>*:last-child:nth-child(odd)]:w-1/2">
                  {isSuperAdmin && (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleBalanceAdjustment}
                        className="w-full sm:w-auto text-sm"
                        size="sm"
                      >
                        <DollarSign className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                        Adjust UC
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toggleUCExemption(!player?.isUCExempt)}
                        disabled={isExemptionPending}
                        className={`w-full sm:w-auto text-sm ${player?.isUCExempt ? "border-amber-600 text-amber-600 hover:bg-amber-50" : ""}`}
                        size="sm"
                      >
                        {isExemptionPending ? (
                          <Loader2 className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0 animate-spin" />
                        ) : (
                          <Shield className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                        )}
                        {player?.isUCExempt ? "Remove Exempt" : "UC Exempt"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => toggleTrusted(!player?.isTrusted)}
                        disabled={isTrustedPending}
                        className={`w-full sm:w-auto text-sm ${player?.isTrusted ? "border-pink-600 text-pink-600 hover:bg-pink-50" : ""}`}
                        size="sm"
                      >
                        {isTrustedPending ? (
                          <Loader2 className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                        )}
                        {player?.isTrusted ? "Remove Trusted" : "Trusted"}
                      </Button>
                    </>
                  )}

                  {isAdmin && (
                    <Button
                      variant={displayIsBanned ? "outline" : "destructive"}
                      onClick={() => toggleBan()}
                      disabled={isBanPending}
                      className={`w-full sm:w-auto text-sm ${displayIsBanned ? "border-green-600 text-green-600 hover:bg-green-50" : ""}`}
                      size="sm"
                    >
                      {displayIsBanned ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                          Unban
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                          Ban
                        </>
                      )}
                    </Button>
                  )}

                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("history", id);
                        router.push(`?${params.toString()}`);
                      }}
                      className="w-full sm:w-auto text-sm"
                      size="sm"
                    >
                      <History className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      History
                    </Button>
                  )}

                  {/* UC Transfer - for PLAYER, ADMIN, SUPER_ADMIN roles, not viewing own profile */}
                  {(user?.role === "USER" || user?.role === "PLAYER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && !isOwnProfile && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-sm border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => setIsTransferDialogOpen(true)}
                      size="sm"
                    >
                      <ArrowUpRight className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      {(player?.user?.userName || initialData?.userName)?.toLowerCase() === "bimon" ? "Send UC" : "Send / Request"}
                    </Button>
                  )}

                  {/* My Profile - for viewing own profile */}
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-sm border-green-600 text-green-600 hover:bg-green-50"
                      onClick={() => router.push("/profile")}
                      size="sm"
                    >
                      <User className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      My Profile
                    </Button>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="mt-5 sm:mt-8 pt-2">
              {isRkoPlayer && !rkoMuted ? (
                <button
                  onClick={toggleRkoMute}
                  className="flex items-end justify-evenly w-full h-10 px-2 rounded-lg border transition-all duration-300 cursor-pointer border-red-500/50 bg-red-50 dark:bg-red-950/30 shadow-[0_0_12px_rgba(220,38,38,0.2)]"
                  title="Mute"
                >
                  {Array.from({ length: 24 }, (_, i) => {
                    const barVariant = (i % 5) + 1;
                    const delayMs = (i * 50) % 300;
                    return (
                      <div
                        key={i}
                        className="w-[2px] sm:w-[3px] rounded-full bg-red-500"
                        style={{
                          animation: `rkoBar${barVariant} 0.4s ease-in-out ${delayMs}ms infinite alternate`,
                        }}
                      />
                    );
                  })}
                </button>
              ) : (
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto" tabIndex={-1}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog >

      {(player || initialData) && (
        <UCTransferDialog
          isOpen={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          toPlayerId={id}
          toPlayerName={
            player
              ? getDisplayName(player.user?.displayName, player.user?.userName) || "Player"
              : getDisplayName(initialData?.displayName, initialData?.userName) || "Player"
          }
          disableRequest={(player?.user?.userName || initialData?.userName)?.toLowerCase() === "bimon"}
        />
      )
      }

      {/* Image Preview Overlay - rendered via Portal to document.body to cover everything */}
      {
        typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isImagePreviewOpen && displayImageUrl && (
              <>
                {/* Backdrop - covers entire page including modal */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md"
                />
                {/* Image - centered, also click to close */}
                <motion.div
                  ref={imagePreviewRef}
                  initial={{ scale: 0.15, opacity: 0, x: avatarPosition.x, y: avatarPosition.y }}
                  animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                  exit={{ scale: 0.15, opacity: 0, x: avatarPosition.x, y: avatarPosition.y }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-64 h-64 sm:w-80 sm:h-80 rounded-full border-4 border-white dark:border-zinc-800 shadow-2xl overflow-hidden"
                >
                  <img
                    src={displayImageUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )
      }
    </>
  );
}
