"use client";
import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "./auth";
import { RoleBaseRoute } from "../common/RoleBaseRouting";
import { AppUpdateManager } from "../AppUpdateManager";
import InstallPrompt from "../InstallPrompt";
import { Toaster } from "sonner";
import { TQueryProvider } from "./query";
import { Layout } from "../common/layout";

type Props = {
  children: React.ReactNode;
};
export const Wrapper = ({ children }: Props) => {
  return (
    <CookiesProvider
      defaultSetOptions={{
        path: "/",
      }}
    >
      <TQueryProvider>
        <AuthProvider>
          <RoleBaseRoute>
            <AppUpdateManager
              updateStrategy={{
                immediate: false,
                delay: 2000,
                retryAttempts: 3,
              }}
              debug={process.env.NODE_ENV === "development"}
            />

            <Layout>{children}</Layout>
            <InstallPrompt />
            <Toaster richColors position="top-right" />
          </RoleBaseRoute>
        </AuthProvider>
      </TQueryProvider>
    </CookiesProvider>
  );
};
