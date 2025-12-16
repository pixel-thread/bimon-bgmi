"use client";
import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "./auth";
import { RoleBaseRoute } from "../common/RoleBaseRouting";
import { Toaster } from "sonner";
import { TQueryProvider } from "./query";
import { Layout } from "../common/layout";
import { ThemeProvider } from "next-themes";
import { ClerkProvider, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { LoaderFour, HairPrank, BatteryPrank, LoadingProvider } from "../ui/loader";

type Props = {
  children: React.ReactNode;
};
export const Wrapper = ({ children }: Props) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <LoadingProvider>
        {/* Pranks rendered at wrapper level to persist through loader transitions */}
        <HairPrank />
        <BatteryPrank />
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          afterSignOutUrl="/"
        >
          {/* Show loading screen while Clerk initializes */}
          <ClerkLoading>
            <div className="h-screen w-full flex items-center justify-center bg-background">
              <LoaderFour text="PUBGMI TOURNAMENT" />
            </div>
          </ClerkLoading>
          <ClerkLoaded>
            <CookiesProvider
              defaultSetOptions={{
                path: "/",
              }}
            >
              <TQueryProvider>
                <AuthProvider>
                  <RoleBaseRoute>
                    <Layout>{children}</Layout>
                    {/* <InstallPrompt /> */}
                    <Toaster richColors position="top-right" />
                  </RoleBaseRoute>
                </AuthProvider>
              </TQueryProvider>
            </CookiesProvider>
          </ClerkLoaded>
        </ClerkProvider>
      </LoadingProvider>
    </ThemeProvider>
  );
};

