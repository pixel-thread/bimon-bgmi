"use client";
import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "./auth";
import { RoleBaseRoute } from "../common/RoleBaseRouting";
import { Toaster } from "sonner";
import { TQueryProvider } from "./query";
import { Layout } from "../common/layout";
import { ThemeProvider } from "next-themes";
import { ClerkProvider, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { LoadingProvider, LoaderFour } from "../ui/loader";
import { InstallPrompt } from "../pwa/InstallPrompt";
import { RouteRestorerProvider } from "../pwa/RouteRestorer";
import { AdSenseScript } from "../common/AdSenseScript";
import { PostHogProvider } from "./PostHogProvider";

type Props = {
  children: React.ReactNode;
};
export const Wrapper = ({ children }: Props) => {
  return (
    <PostHogProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
      >
        <LoadingProvider>
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            afterSignOutUrl="/"
          >
            {/* Show branded loader while Clerk initializes */}
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
                    <RouteRestorerProvider>
                      <RoleBaseRoute>
                        <Layout>{children}</Layout>
                        <InstallPrompt />
                        <AdSenseScript />
                        <Toaster richColors position="top-right" />
                      </RoleBaseRoute>
                    </RouteRestorerProvider>
                  </AuthProvider>
                </TQueryProvider>
              </CookiesProvider>
            </ClerkLoaded>
          </ClerkProvider>
        </LoadingProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
};

