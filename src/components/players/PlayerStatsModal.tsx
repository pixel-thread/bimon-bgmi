"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Avatar } from "@/src/components/ui/avatar";
import { History, Wallet, Edit3, Key, Ban, AlertTriangle } from "lucide-react";
import { PlayerWithStats } from "./types";
import { PasswordManager } from "./PasswordManager";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/src/utils/banUtils";
import { TournamentConfig } from "@/src/lib/types";

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerWithStats | null;
  readOnly?: boolean;
  onViewBalanceHistory: (player: PlayerWithStats) => void;
  onAdjustBalance: (player: PlayerWithStats) => void;
  onEditPlayer: (player: PlayerWithStats) => void;
  userRole: "super_admin" | "teams_admin" | "none";
  tournaments?: TournamentConfig[];
}

const CATEGORY_COLORS = {
  "Ultra Noob":
    "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800",
  Noob: "bg-green-100 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
  Pro: "bg-yellow-100 text-yellow-900 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-800",
  "Ultra Pro":
    "bg-pink-100 text-pink-900 border-pink-200 dark:bg-pink-900 dark:text-pink-100 dark:border-pink-800",
} as const;

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
  "bg-gray-200 text-gray-800 border-gray-300";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function PlayerStatsModal({
  isOpen,
  onClose,
  player,
  readOnly = false,
  onViewBalanceHistory,
  onAdjustBalance,
  onEditPlayer,
  userRole,
  tournaments = [],
}: PlayerStatsModalProps) {
  const [isPasswordManagerOpen, setIsPasswordManagerOpen] =
    React.useState(false);

  if (!player) return null;

  const isSuperAdmin = userRole === "super_admin";
  const banInfo = calculateRemainingBanDuration(player, tournaments);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar
                src={player.avatarBase64 || player.avatarUrl}
                alt={player.name}
                size="xl"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {player.name}
                  </h3>
                  {player.isBanned && (
                    <Badge
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Ban className="w-3 h-3 mr-1" />
                      {banInfo.isExpired ? "BAN EXPIRED" : "BANNED"}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-start">
                  <Badge className={getCategoryColor(player.category)}>
                    {player.category}
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Performance Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {player.matchesPlayed}
                </p>
                <p className="text-sm text-muted-foreground">Matches</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {player.totalKills}
                </p>
                <p className="text-sm text-muted-foreground">Kills</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {player.overallKD}
                </p>
                <p className="text-sm text-muted-foreground">K/D</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p
                  className={`text-2xl font-bold ${
                    Number(player.balance) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  ₹
                  {typeof player.balance === "number"
                    ? player.balance.toFixed(2)
                    : "0.00"}
                </p>
                <p className="text-sm text-muted-foreground">Balance</p>
              </div>
            </div>

            {/* Ban Information */}
            {player.isBanned && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-300" />
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    Ban Information
                  </h4>
                </div>
                <div className="space-y-2 text-sm">
                  {player.banReason && (
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">
                        Reason:
                      </span>
                      <span className="ml-2 text-red-700 dark:text-red-100">
                        {player.banReason}
                      </span>
                    </div>
                  )}
                  {player.bannedAt && (
                    <div>
                      <span className="font-medium text-red-800 dark:text-red-200">
                        Banned On:
                      </span>
                      <span className="ml-2 text-red-700 dark:text-red-100">
                        {new Date(player.bannedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-red-800 dark:text-red-200">
                      Duration:
                    </span>
                    <span className="ml-2 text-red-700 dark:text-red-100">
                      {player.banDuration} tournament
                      {player.banDuration !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-red-800 dark:text-red-200">
                      Status:
                    </span>
                    <span
                      className={`ml-2 font-medium ${
                        banInfo.isExpired
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-100"
                      }`}
                    >
                      {banInfo.isExpired
                        ? "Ban has expired"
                        : `${formatRemainingBanDuration(
                            banInfo.remainingDuration || 0
                          )} remaining`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  onViewBalanceHistory(player);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                Balance History
              </Button>
              {!readOnly && isSuperAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onAdjustBalance(player);
                    }}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Adjust Balance
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      onEditPlayer(player);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Player
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                  setIsPasswordManagerOpen(true);
                }}
              >
                <Key className="w-4 h-4 mr-2" />
                Password
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Manager Modal */}
      <PasswordManager
        isOpen={isPasswordManagerOpen}
        onClose={() => setIsPasswordManagerOpen(false)}
        player={player}
      />
    </>
  );
}
