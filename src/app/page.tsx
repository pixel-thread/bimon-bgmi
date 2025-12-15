// app/page.tsx
"use client";

import { useAuth } from "@/src/hooks/context/auth/useAuth";
import Link from "next/link";
import { Ternary } from "../components/common/Ternary";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

export default function HomePage() {
  const { user, isSignedIn: isAuthorized, isAuthLoading } = useAuth();
  const username = user?.userName;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";

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
                  {/* Sign in button - redirects to auth page */}
                  <Link href="/auth">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto min-w-[220px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-base sm:text-lg py-4 px-6 shadow-lg transition-all duration-200"
                    >
                      Sign In
                    </Button>
                  </Link>
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
