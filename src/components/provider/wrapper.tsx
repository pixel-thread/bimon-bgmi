"use client";
import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "./auth";
import { RoleBaseRoute } from "../common/RoleBaseRouting";
import { Header } from "../common/header";
import { InitializeSuperAdmin } from "../InitializeSuperAdmin";
import { NetworkStatus } from "../NetworkStatus";
import { AppUpdateManager } from "../AppUpdateManager";
import Footer from "../common/Footer";
import InstallPrompt from "../InstallPrompt";
import { Toaster } from "sonner";
import { TQueryProvider } from "./query";

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
            <Header />
            {/* <InitializeSuperAdmin /> */}
            {/* <NetworkStatus /> */}
            {/* <AppUpdateManager */}
            {/*   updateStrategy={{ */}
            {/*     immediate: false, */}
            {/*     delay: 2000, */}
            {/*     retryAttempts: 3, */}
            {/*   }} */}
            {/*   debug={process.env.NODE_ENV === "development"} */}
            {/* /> */}

            {children}
            <Footer />
            {/* <InstallPrompt /> */}
            <Toaster richColors position="top-right" />
          </RoleBaseRoute>
        </AuthProvider>
      </TQueryProvider>
    </CookiesProvider>
  );
};
