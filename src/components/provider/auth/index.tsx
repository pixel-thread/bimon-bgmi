"use client";
import { AUTH_TOKEN_KEY } from "@/src/lib/constant/jwt-key";
import { AuthContext } from "@/src/lib/context/auth";
import { UserT } from "@/src/types/context/auth";
import axiosInstance from "@/src/utils/api";
import http from "@/src/utils/http";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useCookies } from "react-cookie";

type Props = { children: React.ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const { isSignedIn, getToken, signOut } = useAuth();

  // Get user mutation
  const {
    data: user,
    refetch,
    isFetching,
  } = useQuery({
    queryFn: () => http.get<UserT>("/auth"),
    queryKey: ["user"],
    select: (data) => data.data,
  });

  const getUser = useCallback(async () => {
    if (isSignedIn || isFetching === false) {
      const token = await getToken({ template: "jwt" });
      if (token) {
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${token}`;
        refetch();
      }
    }
  }, [isSignedIn, getToken, refetch]);
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
    if (isSignedIn && user === null) {
      getUser();
    }
  }, [isSignedIn, user]);

  // remove token when user is logout from clerk if token still exist

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
