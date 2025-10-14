"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { AlertTriangle, Ban, Trash2, UserX } from "lucide-react";
import { Player, TournamentConfig } from "@/src/lib/types";
import { LoaderFive } from "@/src/components/ui/loader";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/src/utils/banUtils";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/useAuth";
import { sanitizeDisplayName } from "@/src/lib/unicodeSanitizer";

// Custom Input Component
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  paddingX?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, paddingX, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          paddingX && paddingX,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

interface EditPlayerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSave: (player: Player) => Promise<boolean>;
  onDelete: (playerId: string) => Promise<boolean>;
  onBan: (playerId: string, banData: BanData) => Promise<boolean>;
  onUnban: (playerId: string) => Promise<boolean>;
  isSaving: boolean;
  tournaments?: TournamentConfig[];
}

interface BanData {
  reason: string;
  duration: number;
  bannedBy: string;
}

export function EditPlayerDialog({
  isOpen,
  onClose,
  player,
  onSave,
  onDelete,
  onBan,
  onUnban,
  isSaving,
  tournaments = [],
}: EditPlayerDialogProps) {
  const { user } = useAuth();
  const [editedPlayer, setEditedPlayer] = React.useState<Player | null>(null);
  const [showBanSection, setShowBanSection] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [banReason, setBanReason] = React.useState("");
  const [banDuration, setBanDuration] = React.useState(4);

  React.useEffect(() => {
    if (player) {
      setEditedPlayer({ ...player });
      setBanReason(player.banReason || "");
      setBanDuration(player.banDuration || 4);
      setShowBanSection(false);
      setShowDeleteConfirm(false);
    }
  }, [player]);

  const handleSave = async () => {
    if (!editedPlayer) return;

    const success = await onSave(editedPlayer);
    if (success) {
      onClose();
    }
  };

  const handleBan = async () => {
    if (!player || !banReason.trim()) {
      toast.error("Ban reason is required");
      return;
    }

    const banData: BanData = {
      reason: banReason.trim(),
      duration: banDuration,
      bannedBy: user?.email || "Unknown Admin",
    };

    const success = await onBan(player.id, banData);
    if (success) {
      setShowBanSection(false);
      onClose();
    }
  };

  const handleUnban = async () => {
    if (!player) return;

    const success = await onUnban(player.id);
    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!player) return;

    const success = await onDelete(player.id);
    if (success) {
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const getBanStatusBadge = () => {
    if (!player?.isBanned) return null;

    return (
      <Badge
        variant="destructive"
        className="flex items-center gap-1 bg-red-600 text-white"
      >
        <Ban className="h-3 w-3" />
        Banned ({player.banDuration} tournaments)
      </Badge>
    );
  };

  if (!player || !editedPlayer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md sm:max-w-lg bg-black/90 dark:bg-black/90 backdrop-blur-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-indigo-400 flex items-center gap-2">
              Edit Player: {player.name}
              {getBanStatusBadge()}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-indigo-200"
                >
                  Player Name
                </Label>
                <Input
                  id="name"
                  value={editedPlayer.name}
                  onChange={(e) =>
                    setEditedPlayer({
                      ...editedPlayer,
                      name: sanitizeDisplayName(e.target.value),
                    })
                  }
                  disabled={isSaving}
                  paddingX="px-4"
                  className="border-indigo-600 bg-slate-900/50 text-white placeholder-indigo-400/50 focus:ring-indigo-500 text-sm sm:text-base"
                  placeholder="Enter player name"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="category"
                  className="text-sm font-medium text-indigo-200"
                >
                  Category
                </Label>
                <Select
                  value={editedPlayer.category}
                  onValueChange={(value: Player["category"]) =>
                    setEditedPlayer({ ...editedPlayer, category: value })
                  }
                  disabled={isSaving}
                >
                  <SelectTrigger className="border-indigo-600 bg-slate-900/50 text-white focus:ring-indigo-500 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-indigo-600">
                    <SelectItem value="Ultra Noob">Ultra Noob</SelectItem>
                    <SelectItem value="Noob">Noob</SelectItem>
                    <SelectItem value="Pro">Pro</SelectItem>
                    <SelectItem value="Ultra Pro">Ultra Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-indigo-600 to-transparent" />

          {/* Player Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Player Actions
            </h3>

            {showBanSection ? (
              <div className="space-y-4 p-4 border border-red-700 bg-red-900/20 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="banReason"
                    className="text-sm font-medium text-indigo-200"
                  >
                    Ban Reason
                  </Label>
                  <Textarea
                    id="banReason"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Enter reason for banning this player..."
                    disabled={isSaving}
                    className="border-indigo-600 bg-slate-900/50 text-white placeholder-indigo-400/50 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="banDuration"
                    className="text-sm font-medium text-indigo-200"
                  >
                    Ban Duration (Tournaments)
                  </Label>
                  <Select
                    value={banDuration.toString()}
                    onValueChange={(value) => setBanDuration(parseInt(value))}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="border-indigo-600 bg-slate-900/50 text-white focus:ring-indigo-500 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-white border-indigo-600">
                      <SelectItem value="1">1 Tournament</SelectItem>
                      <SelectItem value="2">2 Tournaments</SelectItem>
                      <SelectItem value="3">3 Tournaments</SelectItem>
                      <SelectItem value="4">4 Tournaments (Default)</SelectItem>
                      <SelectItem value="5">5 Tournaments</SelectItem>
                      <SelectItem value="10">10 Tournaments</SelectItem>
                      <SelectItem value="999">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleBan}
                    disabled={isSaving || !banReason.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isSaving ? (
                      <LoaderFive text="Banning..." />
                    ) : (
                      "Confirm Ban"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowBanSection(false)}
                    disabled={isSaving}
                    className="border-indigo-600 text-indigo-400 hover:bg-indigo-900/50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : showDeleteConfirm ? (
              <div className="space-y-4 p-4 border border-red-700 bg-red-900/20 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-red-400">
                    Are you absolutely sure?
                  </h4>
                  <p className="text-sm text-red-300 mt-1">
                    This action cannot be undone. This will permanently delete
                    the player and all associated data.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isSaving ? (
                      <LoaderFive text="Deleting..." />
                    ) : (
                      "Yes, Delete Player"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSaving}
                    className="border-indigo-600 text-indigo-400 hover:bg-indigo-900/50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                {player.isBanned ? (
                  <Button
                    variant="outline"
                    onClick={handleUnban}
                    disabled={isSaving}
                    className="flex-1 w-full sm:w-auto border-indigo-600 text-indigo-400 hover:bg-indigo-900/50 transition-colors"
                  >
                    {isSaving ? (
                      <LoaderFive text="Unbanning..." />
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Unban Player
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowBanSection(true)}
                    disabled={isSaving}
                    className="flex-1 w-full sm:w-auto border-red-700 text-red-400 hover:bg-red-900/50 transition-colors"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Ban Player
                  </Button>
                )}

                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSaving}
                  className="flex-1 w-full sm:w-auto bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Player
                </Button>
              </div>
            )}

            {player.isBanned && !showBanSection && !showDeleteConfirm && (
              <div className="p-4 border border-red-700 bg-red-900/20 rounded-lg transition-all duration-300">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-red-400">
                      Player is currently banned
                    </h4>
                    <p className="text-sm text-red-300">
                      <strong>Reason:</strong> {player.banReason}
                    </p>
                    <p className="text-sm text-red-300">
                      <strong>Duration:</strong> {player.banDuration}{" "}
                      tournaments
                    </p>
                    <p className="text-sm text-red-300">
                      <strong>Remaining:</strong>{" "}
                      {(() => {
                        const banInfo = calculateRemainingBanDuration(
                          player,
                          tournaments,
                        );
                        if (banInfo.isExpired) {
                          return (
                            <span className="text-green-400 font-medium">
                              Ban has expired
                            </span>
                          );
                        }
                        return formatRemainingBanDuration(
                          banInfo.remainingDuration || 0,
                        );
                      })()}
                    </p>
                    <p className="text-sm text-red-300">
                      <strong>Banned by:</strong> {player.bannedBy}
                    </p>
                    {player.bannedAt && (
                      <p className="text-sm text-red-300">
                        <strong>Banned on:</strong>{" "}
                        {new Date(player.bannedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto border-indigo-600 text-indigo-400 hover:bg-indigo-900/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? <LoaderFive text="Saving..." /> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
