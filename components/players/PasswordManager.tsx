"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Key, Lock } from "lucide-react";
import { toast } from "sonner";
import { PlayerWithStats } from "./types";
import { playerAuthService } from "@/lib/playerAuthService";
import { LoaderFive } from "../ui/loader";

// Custom Input Component (included for consistency, not used here)
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
          "flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white",
          paddingX && paddingX,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

interface PlayerAuthData {
  loginPassword?: string;
  lastLoginAt?: string;
}

interface PasswordManagerProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerWithStats | null;
}

export function PasswordManager({
  isOpen,
  onClose,
  player,
}: PasswordManagerProps) {
  const [playerAuthData, setPlayerAuthData] =
    React.useState<PlayerAuthData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPlayerPassword, setShowPlayerPassword] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && player) {
      loadPlayerAuthData();
    }
  }, [isOpen, player]);

  const loadPlayerAuthData = async () => {
    if (!player) return;

    setIsLoading(true);
    try {
      const playerData = await playerAuthService.getPlayerById(player.id);
      if (playerData) {
        setPlayerAuthData({
          loginPassword: playerData.loginPassword,
          lastLoginAt: playerData.lastLoginAt,
        });
      }
    } catch (error) {
      toast.error("Failed to load authentication data");
      console.error("Error loading authentication data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleResetPassword = async () => {
    if (!player) return;

    setIsResettingPassword(true);
    try {
      const newPassword = await playerAuthService.resetPlayerPassword(
        player.id
      );
      setPlayerAuthData((prev) => ({
        ...prev,
        loginPassword: newPassword,
      }));
      toast.success("Player password reset successfully!");
    } catch (error) {
      toast.error("Failed to reset player password.");
      console.error("Error resetting password:", error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!player) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-2xl bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto text-gray-900 dark:text-gray-100 p-4 sm:p-6 animate-in fade-in duration-300 border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
              <span>Password Manager</span>
            </div>
            <span className="text-base sm:text-xl font-medium text-gray-600 dark:text-gray-400">- {player.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Player Authentication Section */}
          <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Key className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
              Player Login Credentials
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-4 sm:py-6">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white"></div>
              </div>
            ) : playerAuthData ? (
              <div className="space-y-4">
                {playerAuthData.loginPassword && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <Lock className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Login Password:
                    </span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <span className="font-mono text-sm sm:text-base text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded">
                      {showPlayerPassword
                        ? playerAuthData.loginPassword
                        : "•".repeat(8)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPlayerPassword(!showPlayerPassword)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        title={showPlayerPassword ? "Hide password" : "Show password"}
                      >
                        {showPlayerPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopyToClipboard(
                            playerAuthData.loginPassword!,
                            "Login password"
                          )
                        }
                        className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Copy password"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  </div>
                )}

                {playerAuthData.lastLoginAt && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-3 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Last Login:</span>{" "}
                    <span className="text-gray-900 dark:text-gray-200">
                      {new Date(playerAuthData.lastLoginAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || isLoading}
                  className={cn(
                    "w-full sm:w-auto bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 text-sm sm:text-base font-medium mt-4 sm:mt-5 px-4 sm:px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow transition-all duration-200",
                    (isResettingPassword || isLoading) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isResettingPassword ? (
                    <span className="flex items-center gap-2">
                      <LoaderFive text="Resetting..." />
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg">
                No authentication data available for this player.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row-reverse gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isResettingPassword || isLoading}
            className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm sm:text-base"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
