"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { LoadingButton } from "@/src/components/ui/loading-button";
import { ProfilePictureUpload } from "@/src/components/ui/profile-picture-upload";
import { CharacterImageUpload } from "@/src/components/ui/character-image-upload";
import { toast } from "sonner";
import { FiUser, FiLock, FiSave } from "react-icons/fi";
import { withAnyAuth } from "@/src/components/withAuth";
import { playerAuthService } from "@/src/lib/playerAuthService";
import { AvatarService } from "@/src/lib/avatarService";
import { CharacterImageService } from "@/src/lib/characterImageService";
import { BackButton } from "@/src/components/common/BackButton";
import SocialAuth from "@/src/components/SocialAuth";
import PlayerSocialAuth from "@/src/components/PlayerSocialAuth";

// Helper function to format remaining time
const formatRemainingTime = (
  lastChangeDate: string
): { days: number; hours: number; minutes: number } => {
  const lastChange = new Date(lastChangeDate);
  const now = new Date();
  const timeDiff = now.getTime() - lastChange.getTime();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const remainingMs = sevenDaysInMs - timeDiff;

  if (remainingMs <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor(
    (remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
  );
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  return { days, hours, minutes };
};

function ProfilePage() {
  const { playerUser, user, authType, refreshAuthState, role } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [playerCategory, setPlayerCategory] = useState<string>("Not Set");
  const [playerAvatarBase64, setPlayerAvatarBase64] = useState<
    string | undefined
  >(undefined);
  const [characterAvatarBase64, setCharacterAvatarBase64] = useState<
    string | undefined
  >(undefined);
  const [nameChangeInfo, setNameChangeInfo] = useState<{
    canChange: boolean;
    lastChangeDate?: string;
  }>({ canChange: true });
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (playerUser && !initialDataLoaded) {
      setFormData((prev) => ({
        ...prev,
        name: playerUser.name || "",
      }));
      setInitialDataLoaded(true);
    }
  }, [playerUser, initialDataLoaded]);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (playerUser?.id) {
        try {
          const playerData = await playerAuthService.getPlayerById(
            playerUser.id
          );
          if (playerData?.category) {
            setPlayerCategory(playerData.category);
          }

          // Set avatar (prefer Base64 over URL)
          if (playerData?.avatarBase64) {
            setPlayerAvatarBase64(playerData.avatarBase64);
          } else if (playerData?.avatarUrl) {
            // Fallback to old avatarUrl if Base64 not available
            setPlayerAvatarBase64(playerData.avatarUrl);
          }

          // Set character avatar
          if (playerData?.characterAvatarBase64) {
            setCharacterAvatarBase64(playerData.characterAvatarBase64);
          }

          // Check name change timeout status
          if (playerData?.lastNameChangeAt) {
            const lastChangeDate = new Date(playerData.lastNameChangeAt);
            const currentDate = new Date();
            const daysSinceLastChange =
              (currentDate.getTime() - lastChangeDate.getTime()) /
              (1000 * 60 * 60 * 24);

            if (daysSinceLastChange < 7) {
              setNameChangeInfo({
                canChange: false,
                lastChangeDate: playerData.lastNameChangeAt,
              });
            } else {
              setNameChangeInfo({
                canChange: true,
                lastChangeDate: playerData.lastNameChangeAt,
              });
            }
          } else {
            setNameChangeInfo({ canChange: true });
          }
        } catch (error) {
          console.error("Failed to fetch player data:", error);
        }
      }
    };

    fetchPlayerData();
  }, [playerUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (!playerUser?.id) {
        throw new Error("Player not authenticated");
      }

      let nameChanged = false;

      if (formData.name !== playerUser.name) {
        try {
          toast.loading("Updating name...");
          await playerAuthService.updatePlayerName(
            playerUser.id,
            formData.name
          );

          // Fetch the updated player data from Firestore
          const updatedPlayerData = await playerAuthService.getPlayerById(
            playerUser.id
          );
          if (updatedPlayerData) {
            // Update local storage with fresh data from Firestore
            const updatedPlayer = {
              id: playerUser.id,
              name: updatedPlayerData.name,
              hasVoted: playerUser.hasVoted,
              loginPassword: playerUser.loginPassword,
            };
            localStorage.setItem(
              "playerSession",
              JSON.stringify(updatedPlayer)
            );

            // Force refresh auth state to sync across all components
            await refreshAuthState();

            // Dispatch storage event to notify other tabs/components
            window.dispatchEvent(
              new StorageEvent("storage", {
                key: "playerSession",
                newValue: JSON.stringify(updatedPlayer),
                oldValue: JSON.stringify(playerUser),
              })
            );
          }

          nameChanged = true;
          toast.dismiss();
          toast.success("Name updated successfully!");

          // Refresh name change info after successful update
          if (updatedPlayerData?.lastNameChangeAt) {
            setNameChangeInfo({
              canChange: false,
              lastChangeDate: updatedPlayerData.lastNameChangeAt,
            });
          }
        } catch (error) {
          console.error("Name update failed:", error);
          toast.dismiss();
          toast.error(
            error instanceof Error ? error.message : "Failed to update name"
          );
          throw error;
        }
      }

      // Update password if provided
      let passwordChanged = false;
      if (formData.password) {
        await playerAuthService.updatePlayerPassword(
          playerUser.id,
          formData.password
        );
        passwordChanged = true;
      }

      // Show appropriate success message
      if (nameChanged && passwordChanged) {
        toast.success("Profile updated successfully!");
      } else if (nameChanged) {
        // Name success toast is already shown above
      } else if (passwordChanged) {
        toast.success("Password updated successfully!");
      }

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));

      // Update auth context without page reload
      if (nameChanged) {
        // The localStorage update will be picked up by the auth context
        // No need to reload the page
        console.log(
          "Name updated successfully - auth context will sync automatically"
        );
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log("Input change:", name, value); // Debug: log exact input including special chars
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarUpload = async (file: File): Promise<string> => {
    console.log("Profile page: Starting avatar upload", {
      playerId: playerUser?.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    if (!playerUser?.id) {
      console.error("Profile page: Player not authenticated");
      throw new Error("Player not authenticated");
    }

    try {
      console.log("Profile page: Calling AvatarService.uploadAvatar...");
      const base64String = await AvatarService.uploadAvatar(
        playerUser.id,
        file
      );
      console.log(
        "Profile page: Upload successful, Base64 length:",
        base64String.length
      );

      setPlayerAvatarBase64(base64String);
      console.log("Profile page: Avatar Base64 state updated");

      return base64String;
    } catch (error) {
      console.error("Profile page: Upload failed:", error);
      throw error;
    }
  };

  const handleAvatarRemove = async (): Promise<void> => {
    if (!playerUser?.id) {
      throw new Error("Player not authenticated");
    }

    await AvatarService.deleteAvatar(playerUser.id);
    setPlayerAvatarBase64(undefined);
  };

  const handleCharacterImageUpload = async (file: File): Promise<string> => {
    console.log("Profile page: Starting character image upload", {
      playerId: playerUser?.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    if (!playerUser?.id) {
      console.error("Profile page: Player not authenticated");
      throw new Error("Player not authenticated");
    }

    try {
      console.log(
        "Profile page: Calling CharacterImageService.uploadCharacterImage..."
      );
      const base64String = await CharacterImageService.uploadCharacterImage(
        playerUser.id,
        file
      );
      console.log(
        "Profile page: Character image upload successful, Base64 length:",
        base64String.length
      );

      setCharacterAvatarBase64(base64String);
      console.log("Profile page: Character avatar Base64 state updated");

      return base64String;
    } catch (error) {
      console.error("Profile page: Character image upload failed:", error);
      throw error;
    }
  };

  const handleCharacterImageRemove = async (): Promise<void> => {
    if (!playerUser?.id) {
      throw new Error("Player not authenticated");
    }

    await CharacterImageService.deleteCharacterImage(playerUser.id);
    setCharacterAvatarBase64(undefined);
  };

  if (!playerUser && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <BackButton />
      </div>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex justify-center">
                <ProfilePictureUpload
                  currentAvatarUrl={playerAvatarBase64}
                  onUpload={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  disabled={loading}
                />
              </div>

              {/* Character Image Upload */}
              <div className="flex justify-center">
                <CharacterImageUpload
                  currentImageBase64={characterAvatarBase64}
                  onUpload={handleCharacterImageUpload}
                  onRemove={handleCharacterImageRemove}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <FiUser className="h-4 w-4" />
                  Display Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading || !nameChangeInfo.canChange}
                  className="mt-1"
                  pattern=".*"
                  title="Any characters including symbols and capital letters are allowed"
                />
                {!nameChangeInfo.canChange && nameChangeInfo.lastChangeDate && (
                  <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                    <p>⚠️ Name changes are limited to once every 7 days.</p>
                    {(() => {
                      const remaining = formatRemainingTime(
                        nameChangeInfo.lastChangeDate
                      );
                      if (remaining.days > 0) {
                        return (
                          <p>
                            You can change your name again in{" "}
                            <strong>
                              {remaining.days} day
                              {remaining.days !== 1 ? "s" : ""}
                            </strong>
                            .
                          </p>
                        );
                      } else if (remaining.hours > 0) {
                        return (
                          <p>
                            You can change your name again in{" "}
                            <strong>
                              {remaining.hours} hour
                              {remaining.hours !== 1 ? "s" : ""}
                            </strong>
                            .
                          </p>
                        );
                      } else {
                        return (
                          <p>
                            You can change your name again in{" "}
                            <strong>
                              {remaining.minutes} minute
                              {remaining.minutes !== 1 ? "s" : ""}
                            </strong>
                            .
                          </p>
                        );
                      }
                    })()}
                    <p className="text-xs text-gray-500 mt-1">
                      Last changed:{" "}
                      {new Date(
                        nameChangeInfo.lastChangeDate
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(
                        nameChangeInfo.lastChangeDate
                      ).toLocaleTimeString()}
                    </p>
                  </div>
                )}
                {/* When allowed, don't show success box to avoid duplication; show policy note below instead */}
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <FiLock className="h-4 w-4" />
                  New Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                  disabled={loading}
                  className="mt-1"
                />
              </div>

              {formData.password && (
                <div>
                  <Label
                    htmlFor="confirmPassword"
                    className="flex items-center gap-2"
                  >
                    <FiLock className="h-4 w-4" />
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Name change policy note (only when change is allowed) */}
              {nameChangeInfo.canChange && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Note: You can change your display name once every 7 days.
                </div>
              )}

              <LoadingButton type="submit" loading={loading} className="w-full">
                <FiSave className="h-4 w-4 mr-2" />
                Save Changes
              </LoadingButton>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Account ID:</strong> {playerUser?.id || user?.uid}
                </p>
                <p>
                  <strong>Account Type:</strong>{" "}
                  {authType === "player" ? "Player" : "Admin"}
                </p>
                {user?.email && (
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                )}
                {playerUser && (
                  <p>
                    <strong>Player Category:</strong>
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {playerCategory}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Authentication Section - Only for Firebase users */}
        {user && authType === "firebase" && (
          <div className="mt-6">
            <SocialAuth
              user={user}
              userRole={role || undefined}
              onAccountLinked={refreshAuthState}
            />
          </div>
        )}

        {/* Social Authentication Section - Only for Player users */}
        {playerUser && authType === "player" && (
          <div className="mt-6">
            <PlayerSocialAuth onAccountLinked={refreshAuthState} />
          </div>
        )}
      </div>
    </div>
  );
}

export default withAnyAuth(ProfilePage);
