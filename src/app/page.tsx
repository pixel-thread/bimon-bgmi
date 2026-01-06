// app/page.tsx
"use client";

import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useRouteRestorer } from "@/src/components/pwa/RouteRestorer";
import Link from "next/link";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LoaderFour } from "../components/ui/loader";
import { FcGoogle } from "react-icons/fc";

// Feature badges data
const FEATURES = [
  "Real-time Scoring",
  "K/D Tracking",
  "Team Management",
  "Player Analytics",
] as const;

// Footer navigation links
const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/guides", label: "Guides" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

// Action button configuration based on role
const getActionConfig = (isSuperAdmin: boolean, isAdmin: boolean) => {
  if (isSuperAdmin) {
    return {
      href: "/admin",
      label: "Full Admin Panel",
      className: "bg-indigo-600 hover:bg-indigo-700",
      showCard: true,
    };
  }
  if (isAdmin) {
    return {
      href: "/admin",
      label: "Team Management",
      className: "bg-blue-600 hover:bg-blue-700",
      showCard: true,
    };
  }
  return {
    href: "/tournament/vote",
    label: "View Tournament",
    className: "bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 dark:text-slate-900",
    showCard: false,
  };
};

// Hero section with title and description
function HeroSection() {
  return (
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
        {FEATURES.map((feature) => (
          <span
            key={feature}
            className="bg-slate-100 dark:bg-slate-700 px-2 sm:px-3 py-1 rounded-full"
          >
            ✓ {feature}
          </span>
        ))}
      </div>
    </div>
  );
}

// Guest welcome card with sign-in button
function GuestCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-5 sm:p-8 text-center">
      <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4">
        Welcome
      </h2>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-5 sm:mb-6">
        Sign in to access the tournament management system and participate in
        PUBG Mobile and BGMI competitions. View live tournaments, check player
        statistics, and join the competitive gaming community.
      </p>
      <div className="space-y-4">
        <Link href="/auth">
          <Button
            size="lg"
            className="w-full sm:w-auto min-w-[220px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-base sm:text-lg py-4 px-6 shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <FcGoogle className="w-5 h-5" />
            Sign in with Google
          </Button>
        </Link>
        <div className="text-sm text-slate-500 dark:text-slate-400 pt-2">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs">
            {FOOTER_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-slate-700 dark:hover:text-slate-300"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// User welcome card with role-based action button
function UserCard({
  username,
  email,
  isSuperAdmin,
  isAdmin,
  isLoading,
}: {
  username?: string;
  email?: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}) {
  const action = getActionConfig(isSuperAdmin, isAdmin);

  const ActionButton = (
    <Link
      href={action.href}
      className={`block w-full px-4 py-3 text-white text-center rounded-lg transition-colors font-semibold ${action.className}`}
    >
      {action.label}
    </Link>
  );

  // Show a clean loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Skeleton className="h-8 w-56 mx-auto mb-3" />
          <Skeleton className="h-5 w-40 mx-auto" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
      {/* Welcome message */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
          Welcome back, {username}!
        </h2>
        <p className="text-slate-600 dark:text-slate-400">{email}</p>
      </div>

      {/* Role-based action button */}
      <div className="grid gap-6">
        {action.showCard ? (
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Admin Access
            </h3>
            {ActionButton}
          </div>
        ) : (
          ActionButton
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, isSignedIn, isAuthLoading } = useAuth();
  const { isRestoring } = useRouteRestorer();

  // Block rendering while PWA is restoring to a saved route
  if (isRestoring) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-background">
        <LoaderFour text="PUBGMI TOURNAMENT" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container h-full mx-auto px-4 py-8 sm:py-16">
        <HeroSection />

        <div className="max-w-4xl mx-auto">
          {isSignedIn ? (
            <UserCard
              username={user?.userName}
              email={user?.email}
              isSuperAdmin={user?.role === "SUPER_ADMIN"}
              isAdmin={user?.role === "ADMIN"}
              isLoading={isAuthLoading}
            />
          ) : (
            <GuestCard />
          )}
        </div>
      </div>
    </div>
  );
}
