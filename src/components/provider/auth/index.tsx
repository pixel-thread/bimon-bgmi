"use client";
import { AUTH_TOKEN_KEY } from "@/src/lib/constant/jwt-key";
import { AuthContext } from "@/src/lib/context/auth";
import { UserT } from "@/src/types/context/auth";
import http from "@/src/utils/http";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { toast } from "sonner";

type Props = { children: React.ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const { isSignedIn, getToken, signOut } = useAuth();
  const [user, setUser] = useState<UserT | null>(null);
  const [cookies, setCookies, removeCookies] = useCookies([AUTH_TOKEN_KEY]);

  // Get user mutation
  const { mutate, isPending } = useMutation({
    mutationFn: () => http.get<UserT>("/auth"),
    onSuccess: (data) => {
      if (data.success) {
        setUser(data.data);
        return data.data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const getUser = useCallback(async () => {
    if (isSignedIn || isPending === false) {
      const token = await getToken({ template: "jwt" });
      if (token) {
        setCookies(AUTH_TOKEN_KEY, token, {
          path: "/",
          sameSite: true,
          secure: true,
        });
        if (cookies.AUTH_TOKEN_KEY) {
          mutate();
        }
      }
    }
  }, [isSignedIn, getToken, cookies.AUTH_TOKEN_KEY, mutate]);
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
    if (isSignedIn && user === null && isPending === false) {
      getUser();
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
        isAuthLoading: isPending,
        isSignedIn: isSignedIn || false,
        refreshAuth: () => mutate(),
        logout: () => onLogout(),
        isSuperAdmin: user?.role === "SUPER_ADMIN",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
