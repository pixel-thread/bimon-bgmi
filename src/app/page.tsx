// app/page.tsx
"use client";

import { useAuth } from "@/src/hooks/context/auth/useAuth";
import Link from "next/link";
import { useSignIn } from "@clerk/nextjs";
import { Ternary } from "../components/common/Ternary";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useState } from "react";

export default function HomePage() {
  const { user, isSignedIn: isAuthorized, isAuthLoading } = useAuth();
  const { signIn, isLoaded } = useSignIn();
  const [isLoading, setIsLoading] = useState(false);
  const username = user?.userName;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/auth/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container h-full mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4">
            PUBGMI Tournament Management System
          </h1>
          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-2">
            Professional tournament management platform for PUBG Mobile and BGMI
            esports competitions. Track teams, manage players, calculate K/D
            statistics, and run competitive gaming events with comprehensive
            analytics and real-time scoring.
          </p>
          <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <span className="bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 rounded-full">
              ✓ Real-time Scoring
            </span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 rounded-full">
              ✓ K/D Tracking
            </span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 rounded-full">
              ✓ Team Management
            </span>
            <span className="bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 rounded-full">
              ✓ Player Analytics
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Ternary
            condition={isAuthorized}
            falseComponent={
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5 sm:p-8 text-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4">
                  Welcome
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-5 sm:mb-6">
                  Sign in to access the tournament management system and
                  participate in PUBG Mobile and BGMI competitions. View live
                  tournaments, check player statistics, and join the competitive
                  gaming community.
                </p>
                <div className="space-y-4">
                  {/* Sign in with Google button - direct OAuth */}
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={!isLoaded || isLoading}
                    size="lg"
                    className="w-full sm:w-auto min-w-[220px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-base sm:text-lg py-4 px-6 shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white dark:border-slate-900 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    )}
                    {isLoading ? "Signing in..." : "Sign in with Google"}
                  </Button>
                  <div className="text-sm text-slate-500 dark:text-slate-400 pt-2">
                    <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs">
                      <Link
                        href="/about"
                        className="hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        About
                      </Link>
                      <Link
                        href="/guides"
                        className="hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Guides
                      </Link>
                      <Link
                        href="/blog"
                        className="hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Blog
                      </Link>
                      <Link
                        href="/faq"
                        className="hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        FAQ
                      </Link>
                      <Link
                        href="/contact"
                        className="hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Contact
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            }
            trueComponent={
              // Logged in
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    {isAuthLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        Welcome back, <Skeleton className="h-7 w-32 inline-block" />
                      </span>
                    ) : (
                      `Welcome back, ${username}!`
                    )}
                  </h2>
                  {isAuthLoading ? (
                    <Skeleton className="h-5 w-48 mx-auto" />
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400">
                      {user?.email}
                    </p>
                  )}
                </div>

                <div className="grid gap-6">
                  <Ternary
                    condition={isSuperAdmin}
                    trueComponent={
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                          Admin Access
                        </h3>
                        <Link
                          href="/admin"
                          className="block w-full px-4 py-2 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Full Admin Panel
                        </Link>
                      </div>
                    }
                    falseComponent={
                      <Ternary
                        condition={isAdmin}
                        trueComponent={
                          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                              Admin Access
                            </h3>
                            <Link
                              href="/admin"
                              className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Team Management
                            </Link>
                          </div>
                        }
                        falseComponent={
                          <Link
                            href="/tournament"
                            className="block w-full px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-center rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-semibold"
                          >
                            View Tournament
                          </Link>
                        }
                      />
                    }
                  />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
