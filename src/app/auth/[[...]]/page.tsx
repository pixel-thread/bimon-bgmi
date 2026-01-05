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
    // Wait for auth to be loaded before starting OAuth
    if (!isLoaded || !signIn || !isAuthLoaded) return;

    // Don't start OAuth if already signed in or already started
    if (isSignedIn || isOAuthStarted) return;

    // Mark that we've started OAuth
    isOAuthStarted = true;

    // Automatically start Google OAuth flow
    signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/auth/sso-callback",
      redirectUrlComplete: redirectTo,
    }).catch((err) => {
      // Ignore errors during redirect (cancelled navigation)
      if (isOAuthStarted) {
        console.log("OAuth redirect in progress, ignoring error:", err?.message);
        return;
      }
      console.error("Failed to redirect to Google:", err);
      setError("Failed to start sign-in. Please try again.");
    });
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
        <p className="text-slate-600 dark:text-slate-400">
          {isSignedIn ? "Redirecting..." : "Redirecting to Google..."}
        </p>
      </div>
    </div>
  );
}
