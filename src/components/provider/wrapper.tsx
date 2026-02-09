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
import { ErrorBoundary } from "../common/ErrorBoundary";
import { useEffect, useState, Suspense } from "react";
import { SilentPWAUpdater, setupGracefulErrorHandler } from "@/src/components/pwa/SilentUpdater";
import { ReferralCapture } from "../common/ReferralCapture";
import { StreakRewardBanner } from "../common/StreakRewardBanner";

type Props = {
  children: React.ReactNode;
};

/**
 * ClerkLoadingGate - Shows loader while Clerk initializes, with timeout for offline
 * After 3 seconds, shows app content anyway (as guest if offline)
 */
function ClerkLoadingGate({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useClerkAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // After 3 seconds, show content regardless of Clerk state
    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  // Show content if Clerk is loaded OR we've timed out
  if (isLoaded || timedOut) {
    return <>{children}</>;
  }

  // Show loader while waiting
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <LoaderFour text="PUBGMI TOURNAMENT" />
    </div>
  );
}

function ClerkContent({ children }: { children: React.ReactNode }) {
  // Setup global error handler for chunk loading failures (graceful, non-intrusive)
  useEffect(() => {
    const cleanup = setupGracefulErrorHandler();
    return cleanup;
  }, []);

  return (
    <ClerkLoadingGate>
      {/* Capture referral codes from URL - must be in Suspense due to useSearchParams */}
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>
      <CookiesProvider
        defaultSetOptions={{
          path: "/",
        }}
      >
        <TQueryProvider>
          <AuthProvider>
            <RouteRestorerProvider>
              <RoleBaseRoute>
                <Layout>
                  <ErrorBoundary>{children}</ErrorBoundary>
                </Layout>
                <InstallPrompt />
                <SilentPWAUpdater />
                <AdSenseScript />
                <StreakRewardBanner />
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
        defaultTheme="light"
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
