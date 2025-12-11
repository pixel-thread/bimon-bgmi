"use client";
import React, { useState } from "react";
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
import { History, Ban, AlertTriangle, CheckCircle, DollarSign, ArrowUpRight, Shield } from "lucide-react";
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

import { getKdRank } from "@/src/utils/categoryUtils";

function ModalSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
        {/* Matches */}
        <div className="text-center p-2.5 sm:p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
          <div className="h-6 sm:h-8 w-10 sm:w-14 bg-blue-200/60 dark:bg-blue-700/40 rounded-md mx-auto mb-2 animate-pulse" />
          <div className="h-3 sm:h-4 w-12 sm:w-16 bg-blue-100 dark:bg-blue-800/30 rounded mx-auto animate-pulse" />
        </div>
        {/* Kills */}
        <div className="text-center p-2.5 sm:p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
          <div className="h-6 sm:h-8 w-10 sm:w-14 bg-green-200/60 dark:bg-green-700/40 rounded-md mx-auto mb-2 animate-pulse" />
          <div className="h-3 sm:h-4 w-10 sm:w-12 bg-green-100 dark:bg-green-800/30 rounded mx-auto animate-pulse" />
        </div>
        {/* K/D */}
        <div className="text-center p-2.5 sm:p-4 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
          <div className="h-6 sm:h-8 w-10 sm:w-14 bg-yellow-200/60 dark:bg-yellow-700/40 rounded-md mx-auto mb-2 animate-pulse" />
          <div className="h-3 sm:h-4 w-8 sm:w-10 bg-yellow-100 dark:bg-yellow-800/30 rounded mx-auto animate-pulse" />
        </div>
        {/* Balance */}
        <div className="text-center p-2.5 sm:p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/30">
          <div className="h-6 sm:h-8 w-14 sm:w-20 bg-purple-200/60 dark:bg-purple-700/40 rounded-md mx-auto mb-2 animate-pulse" />
          <div className="h-3 sm:h-4 w-12 sm:w-14 bg-purple-100 dark:bg-purple-800/30 rounded mx-auto animate-pulse" />
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        <div className="h-8 sm:h-9 w-24 sm:w-28 bg-zinc-200 dark:bg-zinc-700/50 rounded-md animate-pulse" />
        <div className="h-8 sm:h-9 w-24 sm:w-28 bg-zinc-200 dark:bg-zinc-700/50 rounded-md animate-pulse" />
        <div className="h-8 sm:h-9 w-20 sm:w-24 bg-zinc-200 dark:bg-zinc-700/50 rounded-md animate-pulse" />
      </div>
    </div>
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id: string;
};

export function PlayerStatsModal({ isOpen, onClose, id }: Props) {
  const { data: player, isLoading: isPlayerLoading } = usePlayer({ id });
  const { data: stats, isLoading: isStatsLoading } = usePlayerStats({ id });
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const isOwnProfile = user?.playerId === id;

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0 });
  const avatarRef = React.useRef<HTMLDivElement>(null);

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
    if (player?.clerkImageUrl && avatarRef.current) {
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

  const isLoading = isPlayerLoading || isStatsLoading;

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
          className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 sm:gap-3">
              {isLoading ? (
                <div className="flex items-center gap-3">
                  {/* Avatar skeleton */}
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-600 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    {/* Name skeleton */}
                    <div className="h-5 sm:h-6 w-28 sm:w-36 bg-zinc-200 dark:bg-zinc-700 rounded-md animate-pulse mb-2" />
                    {/* Badge skeleton */}
                    <div className="h-5 w-16 sm:w-20 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
                  </div>
                </div>
              ) : !player ? (
                <span>Player Not Found</span>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Clickable Avatar */}
                  <div
                    ref={avatarRef}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleAvatarClick}
                  >
                    {player.clerkImageUrl ? (
                      <img
                        src={player.clerkImageUrl}
                        alt={player.user?.userName || "Player"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-semibold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {player.user?.userName?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                        {player.user?.userName}
                      </span>
                      {player.isBanned && (
                        <Badge
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-xs"
                        >
                          <Ban className="w-3 h-3 mr-0.5 sm:mr-1" />
                          BANNED
                        </Badge>
                      )}
                      {player.isUCExempt && (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-xs"
                        >
                          <Shield className="w-3 h-3 mr-0.5 sm:mr-1" />
                          UC EXEMPT
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-start mt-1">
                      <CategoryBadge
                        category={stats ? getKdRank(stats.kills || 0, stats.deaths || 0) : player.category}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <ModalSkeleton />
          ) : !player ? (
            <div className="text-center py-8 text-muted-foreground">
              Player data could not be loaded
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
                <div className="text-center p-2.5 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {player.matchPlayerPlayed?.length || stats?.matches?.length || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Matches</p>
                </div>
                <div className="text-center p-2.5 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {stats?.kills || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Kills</p>
                </div>
                <div className="text-center p-2.5 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {(() => {
                      const kills = stats?.kills || 0;
                      const deaths = stats?.deaths || 0;
                      const kd = deaths === 0 ? kills : kills / deaths;
                      return kd.toFixed(2);
                    })()}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">K/D</p>
                </div>
                <div className="text-center p-2.5 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p
                    className={`text-xl sm:text-2xl font-bold ${Number(player.uc?.balance) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                      }`}
                  >
                    {typeof player.uc?.balance === "number"
                      ? Math.floor(player.uc?.balance)
                      : "0"} UC
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Balance</p>
                </div>
              </div>

              {player.isBanned && player.playerBanned && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700 dark:text-red-300" />
                    <h4 className="font-semibold text-sm sm:text-base text-red-800 dark:text-red-200">
                      Ban Information
                    </h4>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    {player.playerBanned.banReason && (
                      <div>
                        <span className="font-medium text-red-800 dark:text-red-200">
                          Reason:
                        </span>
                        <span className="ml-1.5 sm:ml-2 text-red-700 dark:text-red-100">
                          {player.playerBanned.banReason}
                        </span>
                      </div>
                    )}
                    {player.playerBanned.bannedAt && (
                      <div>
                        <span className="font-medium text-red-800 dark:text-red-200">
                          Banned On:
                        </span>
                        <span className="ml-1.5 sm:ml-2 text-red-700 dark:text-red-100">
                          {new Date(player.playerBanned.bannedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">
                        Duration:
                      </span>
                      <span className="ml-1.5 sm:ml-2 text-red-700 dark:text-red-100">
                        {player.playerBanned.banDuration} tournament
                        {player.playerBanned.banDuration !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {isSuperAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleBalanceAdjustment}
                      className="w-[calc(50%-0.25rem)] sm:w-auto text-sm min-w-0"
                      size="sm"
                    >
                      <DollarSign className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      <span className="truncate">Adjust UC</span>
                    </Button>
                    <Button
                      variant={player.isUCExempt ? "outline" : "secondary"}
                      onClick={() => toggleUCExemption(!player.isUCExempt)}
                      disabled={isExemptionPending}
                      className={`w-[calc(50%-0.25rem)] sm:w-auto text-sm min-w-0 ${player.isUCExempt ? "border-amber-600 text-amber-600 hover:bg-amber-50" : ""}`}
                      size="sm"
                    >
                      <Shield className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                      <span className="truncate">{player.isUCExempt ? "Remove Exempt" : "UC Exempt"}</span>
                    </Button>
                  </>
                )}

                {isAdmin && (
                  <Button
                    variant={player.isBanned ? "outline" : "destructive"}
                    onClick={() => toggleBan()}
                    disabled={isBanPending}
                    className={`w-[calc(50%-0.25rem)] sm:w-auto text-sm min-w-0 ${player.isBanned ? "border-green-600 text-green-600 hover:bg-green-50" : ""}`}
                    size="sm"
                  >
                    {player.isBanned ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                        <span className="truncate">Unban</span>
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                        <span className="truncate">Ban</span>
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set("history", id);
                    router.push(`?${params.toString()}`);
                  }}
                  className="w-[calc(50%-0.25rem)] sm:w-auto text-sm min-w-0"
                  size="sm"
                >
                  <History className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                  <span className="truncate">History</span>
                </Button>

                {/* UC Transfer - for PLAYER, ADMIN, SUPER_ADMIN roles, not viewing own profile */}
                {(user?.role === "PLAYER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && !isOwnProfile && (
                  <Button
                    variant="outline"
                    className="w-[calc(50%-0.25rem)] sm:w-auto text-sm min-w-0 border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => setIsTransferDialogOpen(true)}
                    size="sm"
                  >
                    <ArrowUpRight className="w-4 h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                    <span className="truncate">Send / Request</span>
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 sm:mt-6">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {player && (
        <UCTransferDialog
          isOpen={isTransferDialogOpen}
          onClose={() => setIsTransferDialogOpen(false)}
          toPlayerId={id}
          toPlayerName={player.user?.userName || "Player"}
        />
      )}

      {/* Image Preview Overlay - rendered via Portal to document.body to cover everything */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isImagePreviewOpen && player?.clerkImageUrl && (
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
                  src={player.clerkImageUrl}
                  alt={player.user?.userName || "Player"}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
