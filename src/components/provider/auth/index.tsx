"use client";
import { AuthContext } from "@/src/lib/context/auth";
import { UserT } from "@/src/types/context/auth";
import axiosInstance, { setAuthTokenGetter } from "@/src/utils/api";
import http from "@/src/utils/http";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { posthog } from "@/src/components/provider/PostHogProvider";

type Props = { children: React.ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const { isSignedIn, getToken, signOut } = useAuth();
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Inject getToken into axios interceptor for automatic auth
  useEffect(() => {
    setAuthTokenGetter(() => getToken({ template: "jwt" }));
  }, [getToken]);

  // Get user mutation
  const {
    data: user,
    refetch,
    isFetching,
  } = useQuery({
    queryFn: () => http.get<UserT>("/auth"),
    queryKey: ["user"],
    select: (data) => data.data,
    enabled: isTokenSet,
    // Refetch on window focus to ensure isOnboarded status is fresh
    // This prevents redirect loops when users return to the app
    refetchOnWindowFocus: true,
    // Keep data fresh for 30 seconds to avoid excessive refetches during normal usage
    staleTime: 30 * 1000,
  });

  const getUser = useCallback(async () => {
    if (isSignedIn || isFetching === false) {
      const token = await getToken({ template: "jwt" });
      if (token) {
        // Keep legacy approach for backwards compatibility
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${token}`;
        setIsTokenSet(true);
      }
    }
  }, [isSignedIn, getToken, isFetching]);

  // logout
  const onLogout = async () => {
    // Set logging out state first to prevent RoleBaseRoute redirects
    setIsLoggingOut(true);
    // Clear PWA saved route to prevent restoring protected page after logout
    if (typeof window !== "undefined") {
      localStorage.removeItem("pwa-last-route");
    }
    await signOut({
      redirectUrl: "/",
    }).then(() => {
      axiosInstance.defaults.headers.common["Authorization"] = "";
    });
  };

  // get user when signed in
  useEffect(() => {
    if (isSignedIn) {
      getUser();
    }
  }, [isSignedIn, getUser]);

  // Identify user in PostHog for proper tracking
  useEffect(() => {
    if (user && posthog.__loaded) {
      posthog.identify(user.id, {
        // Use $name for PostHog to display in PERSON column (instead of email)
        $name: user.displayName || user.userName,
        $email: user.email,
        username: user.userName,
        role: user.role,
      });
    }
  }, [user]);

  // remove token when user is logout from clerk if token still exist
  // No full-page loader - components handle their own loading states via isAuthLoading

  return (
    <AuthContext.Provider
      value={{
        user: user,
        isAuthLoading: (isSignedIn && !isTokenSet) || isFetching,
        isSignedIn: isSignedIn || false,
        isLoggingOut,
        refreshAuth: () => refetch(),
        logout: () => onLogout(),
        isAdmin: user?.role === "ADMIN" || user?.role === "SUPER_ADMIN",
        isSuperAdmin: user?.role === "SUPER_ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
