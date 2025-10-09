// app/page.tsx
"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useEffect } from "react";
import Link from "next/link";
import AdBanner from "@/src/components/AdBanner";
export default function HomePage() {
  const { user, isSignedIn: isAuthorized } = useAuth();
  const username = user?.userName;

  // Load AdSense script only when authorized (pages with meaningful content)
  useEffect(() => {
    if (!isAuthorized) return;
    const src =
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2651043074081875";
    const existing = document.querySelector(
      'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
    );
    if (!existing) {
      const script = document.createElement("script");
      script.async = true;
      script.src = src;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, [isAuthorized]);
  console.log(user);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            PUBGMI Tournament Management System
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Professional tournament management platform for PUBG Mobile and BGMI
            esports competitions. Track teams, manage players, calculate K/D
            statistics, and run competitive gaming events with comprehensive
            analytics and real-time scoring.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              ✓ Real-time Scoring
            </span>
            <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              ✓ K/D Tracking
            </span>
            <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              ✓ Team Management
            </span>
            <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
              ✓ Player Analytics
            </span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {!isAuthorized ? (
            // Not logged in
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Welcome
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Sign in to access the tournament management system and
                participate in PUBG Mobile and BGMI competitions. View live
                tournaments, check player statistics, and join the competitive
                gaming community.
              </p>
              <div className="space-y-4">
                <Link
                  href="/auth"
                  className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </Link>
                <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                  <div>
                    <Link
                      href="/tournament"
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      View Tournament (Public)
                    </Link>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs">
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
          ) : (
            // Logged in
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Welcome back, {username}!
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {user?.email}
                </p>
                <div className="mt-2"></div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Admin Access */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    Admin Access
                  </h3>
                  <div className="space-y-3">
                    {user?.role === "SUPER_ADMIN" && (
                      <Link
                        href="/admin"
                        className="block w-full px-4 py-2 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Full Admin Panel
                      </Link>
                    )}
                    {user?.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Team Management
                      </Link>
                    )}
                  </div>
                </div>

                {/* Public Access */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    Public Access
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/tournament"
                      className="block w-full px-4 py-2 bg-slate-600 text-white text-center rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      View Tournament
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={async () => {
                    const { auth } = await import("@/src/lib/firebase");
                    await auth.signOut();
                  }}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
        {isAuthorized && <AdBanner />}
      </div>
    </div>
  );
}
