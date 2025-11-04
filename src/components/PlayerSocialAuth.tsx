"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import {
  IconBrandGoogle,
  IconLink,
  IconUnlink,
  IconCheck,
  IconLoader,
} from "@tabler/icons-react";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { auth, db } from "@/src/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Player } from "@/src/lib/types";

interface SocialProviderConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  provider: GoogleAuthProvider;
}

const socialProviderConfigs: SocialProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    icon: IconBrandGoogle,
    color: "bg-red-500 hover:bg-red-600",
    provider: new GoogleAuthProvider(),
  },
];

interface PlayerSocialAuthProps {
  className?: string;
  onAccountLinked?: () => void;
}

export default function PlayerSocialAuth({
  className,
  onAccountLinked,
}: PlayerSocialAuthProps) {
  const { playerUser, linkPlayerSocialAccount, unlinkPlayerSocialAccount } =
    useAuth();
  const [linkedAccounts, setLinkedAccounts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [playerData, setPlayerData] = useState<Player | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (playerUser?.id) {
        await fetchLinkedAccounts(isMounted);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [playerUser?.id]); // Only re-fetch when player ID changes

  const fetchLinkedAccounts = async (isMounted: boolean = true) => {
    if (!playerUser?.id) {
      setIsLoading(false);
      return;
    }

    // Prevent fetching if we already have the data and player hasn't changed
    if (playerData && playerData.id === playerUser.id && !isLoading) {
      return;
    }

    try {
      setIsLoading(true);

      // Fetch the full player data from Firestore to get socialProviders
      const playerDocRef = doc(db, "players", playerUser.id);
      const playerDoc = await getDoc(playerDocRef);

      if (playerDoc.exists()) {
        const fullPlayerData = playerDoc.data() as Player;
        setPlayerData(fullPlayerData);

        // Get current linked social accounts from player data
        const socialProviders = fullPlayerData.socialProviders || {};
        setLinkedAccounts(socialProviders);
      } else {
        console.error("Player document not found");
        // No toast here - let the UI handle the error state

        // Set empty player data to prevent repeated fetching
        setPlayerData(null);
        setLinkedAccounts({});
      }
    } catch (error) {
      console.error("Error fetching linked accounts:", error);
      toast.error("Unable to load social accounts");

      // Set empty data on error
      setPlayerData(null);
      setLinkedAccounts({});
    } finally {
      // Only update loading state if component is still mounted
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const handleLinkAccount = async (providerConfig: SocialProviderConfig) => {
    if (!playerUser?.id) {
      toast.error("Player not authenticated");
      return;
    }

    setLoading((prev) => ({ ...prev, [providerConfig.id]: true }));
    try {
      // Sign in with the social provider to get user data
      const result = await signInWithPopup(auth, providerConfig.provider);
      const user = result.user;
      const providerData = user.providerData.find(
        (p) => p.providerId === providerConfig.provider.providerId
      );

      if (!providerData) {
        toast.error("Failed to get provider data");
        return;
      }

      // Link the social account to the player
      await linkPlayerSocialAccount(
        playerUser.id,
        providerConfig.provider.providerId,
        {
          email: providerData.email || undefined,
          displayName: providerData.displayName || undefined,
          photoURL: providerData.photoURL || undefined,
          uid: providerData.uid,
        }
      );

      toast.success(`${providerConfig.name} account connected successfully!`);

      // Refresh the player data to get updated socialProviders
      await fetchLinkedAccounts(true);

      // Refresh auth state
      if (onAccountLinked) {
        onAccountLinked();
      }
    } catch (error: any) {
      console.error(`Error linking ${providerConfig.name} account:`, error);

      // Handle specific error cases
      if (error.code === "auth/popup-blocked") {
        toast.error("Popup was blocked. Please allow popups and try again.");
      } else if (error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in was cancelled. Please try again.");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        toast.error(
          "This social account is already linked to another account."
        );
      } else {
        toast.error(
          `Failed to connect ${providerConfig.name} account: ${error.message}`
        );
      }
    } finally {
      setLoading((prev) => ({ ...prev, [providerConfig.id]: false }));
    }
  };

  const handleUnlinkAccount = async (providerId: string) => {
    if (!playerUser?.id) {
      toast.error("Player not authenticated");
      return;
    }

    const providerConfig = socialProviderConfigs.find(
      (p) => p.provider.providerId === providerId
    );

    try {
      await unlinkPlayerSocialAccount(playerUser.id, providerId);

      toast.success(
        `${providerConfig?.name || "Social"} account disconnected successfully!`
      );
      await fetchLinkedAccounts(true);

      // Refresh auth state
      if (onAccountLinked) {
        onAccountLinked();
      }
    } catch (error: any) {
      console.error("Error unlinking account:", error);
      toast.error(`Failed to disconnect account: ${error.message}`);
    }
  };

  const isProviderLinked = (providerConfig: SocialProviderConfig) => {
    return !!linkedAccounts[providerConfig.provider.providerId];
  };

  const getProviderEmail = (providerId: string) => {
    const account = linkedAccounts[providerId];
    return account?.email;
  };

  // Show error state when no player data is available
  if (!isLoading && !playerData && playerUser?.id) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Connect Social Accounts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts for easier login
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="mb-4">
              <IconUnlink className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                Player Profile Not Found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                We couldn't find your player profile in our system. This usually
                means:
              </p>
              <ul className="text-xs text-muted-foreground text-left space-y-1 mb-4">
                <li>• Your account may not be fully set up yet</li>
                <li>• There might be a connection issue</li>
                <li>• Your player data could be temporarily unavailable</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => fetchLinkedAccounts(true)}
                variant="outline"
                size="sm"
              >
                <IconLoader className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <p className="text-xs text-muted-foreground">
                If this problem persists, please contact support or try logging
                out and logging back in.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Connect Social Accounts
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts for easier login
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <IconLoader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Connect Social Accounts
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect your Google account for easier login and enhanced profile
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {socialProviderConfigs.map((providerConfig) => {
            const isLinked = isProviderLinked(providerConfig);
            const providerEmail = getProviderEmail(
              providerConfig.provider.providerId
            );

            return (
              <div
                key={providerConfig.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isLinked
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : "bg-gray-50 dark:bg-gray-800"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn("p-2 rounded-lg", providerConfig.color)}>
                    <providerConfig.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{providerConfig.name}</p>
                    {isLinked && providerEmail && (
                      <p className="text-xs text-muted-foreground">
                        {providerEmail}
                      </p>
                    )}
                    {isLinked && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                        <IconCheck className="h-3 w-3 mr-1" />
                        Connected
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant={isLinked ? "outline" : "default"}
                  size="sm"
                  onClick={() =>
                    isLinked
                      ? handleUnlinkAccount(providerConfig.provider.providerId)
                      : handleLinkAccount(providerConfig)
                  }
                  disabled={loading[providerConfig.id]}
                  className="min-w-[80px]"
                >
                  {loading[providerConfig.id] ? (
                    <IconLoader className="h-4 w-4 animate-spin" />
                  ) : isLinked ? (
                    <>
                      <IconUnlink className="h-4 w-4 mr-1" />
                      Disconnect
                    </>
                  ) : (
                    <>
                      <IconLink className="h-4 w-4 mr-1" />
                      Connect
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <strong>Note:</strong> Connected Google account allows you to log in
            with a single click.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
