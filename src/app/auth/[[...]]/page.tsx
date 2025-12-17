"use client";

import { useSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AuthPage() {
  const { signIn, isLoaded } = useSignIn();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !signIn) return;

    // Automatically start Google OAuth flow
    signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/auth/sso-callback",
      redirectUrlComplete: "/",
    }).catch((err) => {
      console.error("Failed to redirect to Google:", err);
      setError("Failed to start sign-in. Please try again.");
    });
  }, [isLoaded, signIn]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => window.location.reload()}
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
        <p className="text-slate-600 dark:text-slate-400">Redirecting to Google...</p>
      </div>
    </div>
  );
}
