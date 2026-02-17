// app/page.tsx
"use client";

import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { useRouteRestorer } from "@/src/components/pwa/RouteRestorer";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { LoaderFour } from "../components/ui/loader";
import { FcGoogle } from "react-icons/fc";
import { FaWhatsapp } from "react-icons/fa";
import { useState, useEffect } from "react";

// WhatsApp group configuration
const WHATSAPP_GROUPS = [
  {
    id: "group1",
    name: "Group 1",
    link: "https://chat.whatsapp.com/DV9xBTjp7Q30VU1ITzFpMM",
  },
  {
    id: "group2",
    name: "Group 2",
    link: "https://chat.whatsapp.com/CNuujmMWQNpCdKGze69k0j",
  },
] as const;

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

// WhatsApp button with dialog - can auto-open for new users
function WhatsAppButton({ autoOpen = false }: { autoOpen?: boolean }) {
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load joined groups from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("whatsapp_joined_groups");
    if (stored) {
      try {
        setJoinedGroups(new Set(JSON.parse(stored)));
      } catch {
        // Invalid data, ignore
      }
    }
    setIsHydrated(true);
  }, []);

  // Auto-open dialog for new users from onboarding
  useEffect(() => {
    if (autoOpen && isHydrated) {
      // Check if there are groups to show
      const stored = localStorage.getItem("whatsapp_joined_groups");
      const joined = stored ? new Set(JSON.parse(stored)) : new Set();
      const hasGroupsToShow = WHATSAPP_GROUPS.some(g => !joined.has(g.id));
      if (hasGroupsToShow) {
        // Small delay for better UX
        const timer = setTimeout(() => setIsOpen(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [autoOpen, isHydrated]);

  // Track if user was auto-opened (for hiding close button)
  const [wasAutoOpened, setWasAutoOpened] = useState(false);

  // Set wasAutoOpened when auto-opening
  useEffect(() => {
    if (autoOpen && isOpen) {
      setWasAutoOpened(true);
    }
  }, [autoOpen, isOpen]);

  const handleJoinGroup = (groupId: string, link: string) => {
    // Open WhatsApp link in new tab
    window.open(link, "_blank", "noopener,noreferrer");

    // Mark group as joined
    const newJoined = new Set(joinedGroups);
    newJoined.add(groupId);
    setJoinedGroups(newJoined);

    // Persist to localStorage
    localStorage.setItem("whatsapp_joined_groups", JSON.stringify([...newJoined]));

    // Allow closing after joining at least one group
    setWasAutoOpened(false);
  };

  // Don't render until hydrated to avoid hydration mismatch
  if (!isHydrated) return null;

  // Filter out joined groups
  const availableGroups = WHATSAPP_GROUPS.filter(
    (group) => !joinedGroups.has(group.id)
  );

  // Don't show anything if all groups are joined
  if (availableGroups.length === 0) return null;

  return (
    <>
      {/* WhatsApp Button - inline style to match neighboring buttons */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 flex-shrink-0"
        aria-label="Join WhatsApp Groups"
      >
        <FaWhatsapp className="w-6 h-6" />
      </button>

      {/* Dialog Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => !wasAutoOpened && setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <FaWhatsapp className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Join WhatsApp
                </h2>
              </div>
              {!wasAutoOpened && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Join our WhatsApp groups to get <span className="text-red-500 font-semibold">Room ID, passwords</span>, and other important updates.
            </p>

            {/* Group Buttons */}
            <div className="space-y-3">
              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleJoinGroup(group.id, group.link)}
                  className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl transition-colors group"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaWhatsapp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {group.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tap to join
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-xs text-center text-slate-400 mt-4">
              Buttons will disappear after you join
            </p>
          </div>
        </div>
      )}
    </>
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
        <div className="flex items-center justify-center gap-3">
          <Link href="/auth">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[220px] bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-base sm:text-lg py-4 px-6 shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <FcGoogle className="w-5 h-5" />
              Sign in with Google
            </Button>
          </Link>
        </div>
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
  isNewUser = false,
}: {
  username?: string;
  email?: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  isNewUser?: boolean;
}) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const action = getActionConfig(isSuperAdmin, isAdmin);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsNavigating(true);
    router.push(action.href);
  };

  const ActionButton = (
    <button
      onClick={handleClick}
      disabled={isNavigating}
      className={`block w-full px-4 py-3 text-white text-center rounded-lg transition-colors font-semibold ${action.className} ${isNavigating ? 'opacity-80' : ''}`}
    >
      {isNavigating ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        action.label
      )}
    </button>
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
          {isNewUser ? "Welcome" : "Welcome back"}, {username}!
        </h2>
        <p className="text-slate-600 dark:text-slate-400">{email}</p>
      </div>

      {/* Action button with WhatsApp */}
      <div className="flex items-center justify-center gap-3">
        {ActionButton}
        <WhatsAppButton autoOpen={isNewUser} />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, isSignedIn, isAuthLoading } = useAuth();
  const { isRestoring } = useRouteRestorer();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Detect and preserve new user status (from onboarding redirect)
  // Use sessionStorage to persist across re-renders caused by router.replace
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check sessionStorage first for persisted new user status
    const storedNewUser = sessionStorage.getItem("is_new_user");
    if (storedNewUser === "true") {
      setIsNewUser(true);
      return; // Already processed, don't check URL again
    }

    const welcomeParam = searchParams.get("welcome") === "1";
    if (welcomeParam) {
      setIsNewUser(true);
      // Persist to sessionStorage so it survives the URL cleanup
      sessionStorage.setItem("is_new_user", "true");
      // Clean up URL without losing the state
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  // Clear the new user flag when WhatsApp groups are joined (or after some time)
  useEffect(() => {
    if (isNewUser) {
      // Clear the flag after 30 seconds to avoid showing forever
      const timer = setTimeout(() => {
        sessionStorage.removeItem("is_new_user");
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [isNewUser]);

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
              username={user?.displayName || user?.userName}
              email={user?.email}
              isSuperAdmin={user?.role === "SUPER_ADMIN"}
              isAdmin={user?.role === "ADMIN"}
              isLoading={isAuthLoading}
              isNewUser={isNewUser}
            />
          ) : (
            <GuestCard />
          )}
        </div>
      </div>
    </div>
  );
}
