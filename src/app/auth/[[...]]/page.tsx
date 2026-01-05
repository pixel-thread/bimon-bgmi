"use client";

import { useSignIn, useAuth } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Module-level flag to prevent double OAuth calls in React Strict Mode
let isOAuthStarted = false;

export default function AuthPage() {
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  // Reset the flag when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      // Small delay to allow redirect to complete before resetting
      setTimeout(() => {
        isOAuthStarted = false;
      }, 1000);
    };
  }, []);

  // If already signed in, redirect to destination
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      router.replace(redirectTo);
    }
  }, [isAuthLoaded, isSignedIn, redirectTo, router]);

  useEffect(() => {
    const startOAuth = async () => {
      // Wait for auth to be loaded before starting OAuth
      if (!isLoaded || !signIn || !isAuthLoaded) return;

      // Don't start OAuth if already signed in or already started
      if (isSignedIn || isOAuthStarted) return;

      // Mark that we've started OAuth
      isOAuthStarted = true;

      try {
        // Create a fresh sign-in attempt to avoid stale session issues
        await signIn.create({
          strategy: "oauth_google",
          redirectUrl: "/auth/sso-callback",
          actionCompleteRedirectUrl: redirectTo,
        });

        // Get the authorization URL and redirect
        const authUrl = signIn.firstFactorVerification?.externalVerificationRedirectURL;
        if (authUrl) {
          window.location.href = authUrl.href;
        } else {
          // Fallback to authenticateWithRedirect
          await signIn.authenticateWithRedirect({
            strategy: "oauth_google",
            redirectUrl: "/auth/sso-callback",
            redirectUrlComplete: redirectTo,
          });
        }
      } catch (err: any) {
        // Ignore errors during redirect (cancelled navigation)
        if (isOAuthStarted) {
          console.log("OAuth redirect in progress, ignoring error:", err?.message);
          return;
        }
        console.error("Failed to redirect to Google:", err);
        setError("Failed to start sign-in. Please try again.");
      }
    };

    startOAuth();
  }, [isLoaded, signIn, redirectTo, isAuthLoaded, isSignedIn]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => {
            isOAuthStarted = false;
            window.location.reload();
          }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
    </div>
  );
}
