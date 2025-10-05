"use client";

import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { User, updateProfile, fetchSignInMethodsForEmail } from "firebase/auth";
import {
  SocialAuthService,
  socialProviders,
  LinkedAccount,
} from "@/lib/socialAuthService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  IconBrandGoogle,
  IconBrandFacebook,
  IconBrandGithub,
  IconBrandTwitter,
  IconLink,
  IconUnlink,
  IconCheck,
  IconLoader,
} from "@tabler/icons-react";

interface SocialProviderConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const socialProviderConfigs: SocialProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    icon: IconBrandGoogle,
    color: "bg-red-500 hover:bg-red-600",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: IconBrandFacebook,
    color: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "github",
    name: "GitHub",
    icon: IconBrandGithub,
    color: "bg-gray-800 hover:bg-gray-900",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: IconBrandTwitter,
    color: "bg-sky-500 hover:bg-sky-600",
  },
];

interface SocialAuthProps {
  user: User;
  userRole?: string;
  refreshAuthState?: () => void;
  onAccountLinked?: () => void;
  className?: string;
}

export default function SocialAuth({
  user,
  userRole,
  refreshAuthState,
  onAccountLinked,
  className,
}: SocialAuthProps) {
  const [linkedAccounts, setLinkedAccounts] = useState<
    Record<string, LinkedAccount>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(userRole === "admin" || userRole === "super_admin");
    fetchLinkedAccounts();
  }, [user, userRole]);

  const fetchLinkedAccounts = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      // Get current sign-in methods for the email
      const methods = await fetchSignInMethodsForEmail(auth, user.email);

      const accounts: Record<string, LinkedAccount> = {};

      // Map sign-in methods to providers
      methods.forEach((method) => {
        const provider = method
          .replace(".com", "")
          .replace("password", "email");
        accounts[method] = {
          provider: method,
          email: user.email || undefined,
          linkedAt: new Date().toISOString(),
        };
      });

      setLinkedAccounts(accounts);
    } catch (error) {
      console.error("Error fetching linked accounts:", error);
      toast.error("Failed to fetch linked accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (providerConfig: SocialProviderConfig) => {
    if (!user) return;

    setLoading((prev) => ({ ...prev, [providerConfig.id]: true }));
    try {
      const provider = socialProviders.find((p) => p.id === providerConfig.id);
      if (!provider) {
        toast.error("Provider not found");
        return;
      }

      const result = await SocialAuthService.linkSocialAccount(
        user,
        provider,
        isAdmin ? "admin" : undefined
      );

      if (result.success) {
        toast.success(result.message);
        await fetchLinkedAccounts();

        // Refresh auth state
        if (refreshAuthState) {
          refreshAuthState();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error(`Error linking ${providerConfig.name} account:`, error);
      toast.error(
        `Failed to link ${providerConfig.name} account: ${error.message}`
      );
    } finally {
      setLoading((prev) => ({ ...prev, [providerConfig.id]: false }));
    }
  };

  const handleUnlinkAccount = async (providerId: string) => {
    if (!user) return;

    try {
      const result = await SocialAuthService.unlinkSocialAccount(
        user,
        providerId
      );

      if (result.success) {
        toast.success(result.message);
        await fetchLinkedAccounts();

        // Refresh auth state
        if (refreshAuthState) {
          refreshAuthState();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Error unlinking account:", error);
      toast.error(`Failed to unlink account: ${error.message}`);
    }
  };

  const isProviderLinked = (providerConfig: SocialProviderConfig) => {
    const provider = socialProviders.find((p) => p.id === providerConfig.id);
    return provider ? !!linkedAccounts[provider.provider.providerId] : false;
  };

  const getProviderEmail = (providerId: string) => {
    const providerData = user.providerData.find(
      (p) => p.providerId === providerId
    );
    return providerData?.email || linkedAccounts[providerId]?.email;
  };

  const getProviderById = (providerId: string) => {
    return socialProviders.find((p) => p.provider.providerId === providerId);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {isAdmin ? "Link Social Accounts" : "Connect Social Accounts"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Link your Google account for easier admin access"
            : "Connect your Google account to enhance your profile"}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {socialProviderConfigs.map((providerConfig) => {
            const isLinked = isProviderLinked(providerConfig);
            const provider = getProviderById(providerConfig.id);
            const providerEmail = provider
              ? getProviderEmail(provider.provider.providerId)
              : undefined;

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
                    isLinked && provider
                      ? handleUnlinkAccount(provider.provider.providerId)
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
                      Unlink
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
            <strong>Note:</strong> You must keep at least one authentication
            method active.
            {isAdmin
              ? " Google account allows quick access."
              : " Google account enhances your profile visibility."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}