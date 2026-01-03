"use client";
import { AuthContext } from "@/src/lib/context/auth";
import { UserT } from "@/src/types/context/auth";
import axiosInstance, { setAuthTokenGetter } from "@/src/utils/api";
import http from "@/src/utils/http";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

type Props = { children: React.ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const { isSignedIn, getToken, signOut } = useAuth();
  const [isTokenSet, setIsTokenSet] = useState(false);

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
    refetchOnWindowFocus: false,
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
    await signOut({
      redirectUrl: "/",
      sessionId: "",
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

  // remove token when user is logout from clerk if token still exist
  // No full-page loader - components handle their own loading states via isAuthLoading

  return (
    <AuthContext.Provider
      value={{
        user: user,
        isAuthLoading: (isSignedIn && !isTokenSet) || isFetching,
        isSignedIn: isSignedIn || false,
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
