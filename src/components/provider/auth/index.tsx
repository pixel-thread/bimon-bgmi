"use client";
import { AUTH_TOKEN_KEY } from "@/src/lib/constant/jwt-key";
import { AuthContext } from "@/src/lib/context/auth";
import { UserT } from "@/src/types/context/auth";
import http from "@/src/utils/http";
import { logger } from "@/src/utils/logger";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { toast } from "sonner";

type Props = { children: React.ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const { isSignedIn, getToken, signOut } = useAuth();
  const [user, setUser] = useState<UserT | null>(null);
  const [cookies, setCookies, removeCookies] = useCookies([AUTH_TOKEN_KEY]);

  // Get user mutation
  const { refetch, isFetching } = useQuery({
    queryFn: () => http.get<UserT>("/auth"),
    queryKey: ["user"],
    select: (data) => data.data,
  });

  const getUser = useCallback(async () => {
    if (isSignedIn || isFetching === false) {
      const token = await getToken({ template: "jwt" });
      if (token) {
        setCookies(AUTH_TOKEN_KEY, token, {
          path: "/",
          sameSite: true,
          secure: true,
        });
        if (cookies.AUTH_TOKEN_KEY) {
          refetch();
        }
      }
    }
  }, [isSignedIn, getToken, cookies.AUTH_TOKEN_KEY, refetch]);
  // logout
  const onLogout = async () => {
    removeCookies(AUTH_TOKEN_KEY);
    setUser(null);
    await signOut({
      redirectUrl: "/",
      sessionId: "",
    });
  };

  // get user when signed in
  useEffect(() => {
    getUser();
    if (isSignedIn && user === null) {
    }
  }, [isSignedIn, user]);

  // remove token when user is logout from clerk if token still exist
  useEffect(() => {
    if (!isSignedIn && !!cookies?.AUTH_TOKEN_KEY) {
      removeCookies(AUTH_TOKEN_KEY);
    }
  }, [isSignedIn]);

  return (
    <AuthContext.Provider
      value={{
        user: user,
        isAuthLoading: isFetching,
        isSignedIn: isSignedIn || false,
        refreshAuth: () => refetch(),
        logout: () => onLogout(),
        isSuperAdmin: user?.role === "SUPER_ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
