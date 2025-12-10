"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { History, Ban, AlertTriangle, CheckCircle, DollarSign, ArrowUpRight, Shield } from "lucide-react";
import { usePlayer } from "@/src/hooks/player/usePlayer";
import { usePlayerStats } from "@/src/hooks/player/usePlayerStats";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { UCTransferDialog } from "./UCTransferDialog";

const CATEGORY_COLORS = {
  "Ultra Noob":
    "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800",
  Noob: "bg-green-100 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
  Pro: "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800",
  "Ultra Pro":
    "bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-900 dark:text-pink-100 dark:border-pink-800",
} as const;

import { getKdRank } from "@/src/utils/categoryUtils";

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
  "bg-gray-200 text-gray-800 border-gray-300";

function ModalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
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
  const isOwnProfile = (user?.playerId || user?.player?.id) === id;

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {isLoading ? (
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              ) : !player ? (
                <span>Player Not Found</span>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {player.user?.userName}
                    </span>
                    {player.isBanned && (
                      <Badge
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Ban className="w-3 h-3 mr-1" />
                        BANNED
                      </Badge>
                    )}
                    {player.isUCExempt && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        UC EXEMPT
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-start mt-1">
                    <Badge className={getCategoryColor(stats ? getKdRank(stats.kills || 0, stats.deaths || 0) : player.category)}>
                      {stats ? getKdRank(stats.kills || 0, stats.deaths || 0) : player.category}
                    </Badge>
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {player.matchPlayerPlayed?.length || stats?.matches?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Matches</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {stats?.kills || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Kills</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {(() => {
                      const kills = stats?.kills || 0;
                      const deaths = stats?.deaths || 0;
                      const kd = deaths === 0 ? kills : kills / deaths;
                      return kd.toFixed(2);
                    })()}
                  </p>
                  <p className="text-sm text-muted-foreground">K/D</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p
                    className={`text-2xl font-bold ${Number(player.uc?.balance) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                      }`}
                  >
                    {typeof player.uc?.balance === "number"
                      ? Math.floor(player.uc?.balance)
                      : "0"} UC
                  </p>
                  <p className="text-sm text-muted-foreground">Balance</p>
                </div>
              </div>

              {player.isBanned && player.playerBanned && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-300" />
                    <h4 className="font-semibold text-red-800 dark:text-red-200">
                      Ban Information
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {player.playerBanned.banReason && (
                      <div>
                        <span className="font-medium text-red-800 dark:text-red-200">
                          Reason:
                        </span>
                        <span className="ml-2 text-red-700 dark:text-red-100">
                          {player.playerBanned.banReason}
                        </span>
                      </div>
                    )}
                    {player.playerBanned.bannedAt && (
                      <div>
                        <span className="font-medium text-red-800 dark:text-red-200">
                          Banned On:
                        </span>
                        <span className="ml-2 text-red-700 dark:text-red-100">
                          {new Date(player.playerBanned.bannedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">
                        Duration:
                      </span>
                      <span className="ml-2 text-red-700 dark:text-red-100">
                        {player.playerBanned.banDuration} tournament
                        {player.playerBanned.banDuration !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center flex-wrap">
                {isSuperAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleBalanceAdjustment}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Balance Adjustment
                    </Button>
                    <Button
                      variant={player.isUCExempt ? "outline" : "secondary"}
                      onClick={() => toggleUCExemption(!player.isUCExempt)}
                      disabled={isExemptionPending}
                      className={player.isUCExempt ? "border-amber-600 text-amber-600 hover:bg-amber-50" : ""}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {player.isUCExempt ? "Remove UC Exemption" : "Grant UC Exemption"}
                    </Button>
                  </>
                )}

                {isAdmin && (
                  <Button
                    variant={player.isBanned ? "outline" : "destructive"}
                    onClick={() => toggleBan()}
                    disabled={isBanPending}
                    className={player.isBanned ? "border-green-600 text-green-600 hover:bg-green-50" : ""}
                  >
                    {player.isBanned ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unban Player
                      </>
                    ) : (
                      <>
                        <Ban className="w-4 h-4 mr-2" />
                        Ban Player
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
                >
                  <History className="w-4 h-4 mr-2" />
                  Balance History
                </Button>

                {/* UC Transfer - for PLAYER, ADMIN, SUPER_ADMIN roles, not viewing own profile */}
                {(user?.role === "PLAYER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && !isOwnProfile && (
                  <Button
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    onClick={() => setIsTransferDialogOpen(true)}
                  >
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Send / Request UC
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
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
    </>
  );
}
