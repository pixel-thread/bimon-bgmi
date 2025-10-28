"use client";
import { AuthContext } from "@/src/lib/context/auth";
import { UserT } from "@/src/types/context/auth";
import http from "@/src/utils/http";
import { useAuth } from "@clerk/clerk-react";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useCookies } from "react-cookie";

type Props = { children: React.ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const { isSignedIn, getToken, signOut } = useAuth();
  const [user, setUser] = useState<UserT | null>(null);
  const [cookies, setCookies, removeCookies] = useCookies(["token"]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => http.get<UserT>("/auth"),
    onSuccess: (data) => {
      if (data.success) {
        setUser(data.data);
        return data.data;
      }
    },
  });

  const getUser = useCallback(async () => {
    if (isSignedIn || isPending === false) {
      const token = await getToken({ template: "jwt" });
      if (token) {
        setCookies("token", token);
        if (cookies.token) {
          mutate();
        }
      }
    }
  }, [isSignedIn, getToken, cookies.token, mutate]);

  const onLogout = async () => {
    removeCookies("token");
    await signOut({
      redirectUrl: "/",
      sessionId: "",
    });
    setUser(null);
  };

  useEffect(() => {
    if (isSignedIn && user === null && isPending === false) {
      getUser();
    }
  }, [isSignedIn, user]);

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
