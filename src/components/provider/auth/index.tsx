"use client";
import { AuthContext } from "@/src/lib/context/auth";
import { UserT } from "@/src/types/context/auth";
import axiosInstance from "@/src/utils/api";
import http from "@/src/utils/http";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { LoaderFour } from "../../ui/loader";

type Props = { children: React.ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const { isSignedIn, getToken, signOut } = useAuth();
  const [isTokenSet, setIsTokenSet] = useState(false);
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
        axiosInstance.defaults.headers.common["Authorization"] =
          `Bearer ${token}`;
        setIsTokenSet(true);
      }
    }
  }, [isSignedIn, getToken]);

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
  }, [isSignedIn]);

  // remove token when user is logout from clerk if token still exist

  if (isSignedIn && !isTokenSet) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-zinc-950">
        <LoaderFour text="PUBGMI TOURNAMENT" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: user,
        isAuthLoading: (isSignedIn && !isTokenSet) || isFetching,
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
