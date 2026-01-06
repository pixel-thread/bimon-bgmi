"use client";
import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "./auth";
import { RoleBaseRoute } from "../common/RoleBaseRouting";
import { Toaster } from "sonner";
import { TQueryProvider } from "./query";
import { Layout } from "../common/layout";
import { ThemeProvider } from "next-themes";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/nextjs";
import { LoadingProvider, LoaderFour } from "../ui/loader";
import { InstallPrompt } from "../pwa/InstallPrompt";
import { RouteRestorerProvider } from "../pwa/RouteRestorer";
import { AdSenseScript } from "../common/AdSenseScript";
import { PostHogProvider } from "./PostHogProvider";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

/**
 * ClerkLoadingGate - Shows loader while Clerk initializes, with timeout for offline
 * After 1 second, shows app content anyway (as guest if offline)
 */
function ClerkLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useClerkAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    console.log("ClerkLoadingGate: isLoaded =", isLoaded, "timedOut =", timedOut);

    // After 1 second, show content regardless of Clerk state
    const timeout = setTimeout(() => {
      console.log("ClerkLoadingGate: Timeout triggered, isLoaded =", isLoaded);
      setTimedOut(true);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [isLoaded, timedOut]);

  console.log("ClerkLoadingGate render: isLoaded =", isLoaded, "timedOut =", timedOut);

  // Show content if Clerk is loaded OR we've timed out
  if (isLoaded || timedOut) {
    console.log("ClerkLoadingGate: Rendering children");
    return <>{children}</>;
  }

  // Show loader while waiting
  console.log("ClerkLoadingGate: Rendering loader");
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <LoaderFour text="PUBGMI TOURNAMENT" />
    </div>
  );
}

function ClerkContent({ children }: { children: React.ReactNode }) {
  return (
    <ClerkLoadingGate>
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
    </ClerkLoadingGate>
  );
}

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
            <ClerkContent>{children}</ClerkContent>
          </ClerkProvider>
        </LoadingProvider>
      </ThemeProvider>
    </PostHogProvider>
  );
};
