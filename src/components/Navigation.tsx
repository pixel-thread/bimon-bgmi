"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { usePendingUCRequests } from "@/src/hooks/uc/usePendingUCRequests";
import {
    FiMenu,
    FiX,
    FiLogIn,
    FiLogOut,
    FiSun,
    FiMoon,
    FiHome,
    FiInfo,
    FiHelpCircle,
    FiUser,
    FiUsers,
    FiShield,
    FiFileText,
    FiCheckSquare,
    FiLoader,
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { Crown } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import { getDisplayName } from "@/src/utils/displayName";

// Shared navigation items with icons for mobile
const navItems = [
    { href: "/", label: "Home", icon: FiHome },
    { href: "/about", label: "About", icon: FiInfo },
    { href: "/how-it-works", label: "How It Works", icon: FiHelpCircle },
    { href: "/tournament/players", label: "Players", icon: FiUsers },
    { href: "/tournament/vote", label: "Vote", icon: FiCheckSquare },
    { href: "/tournament/rules", label: "Rules", icon: FiFileText },
];

const authNavItems = [
    { href: "/profile", label: "Profile", icon: FiUser, showNotification: true },
];

// Animation variants for staggered menu items
const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
};

export default function Navigation() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const { isSignedIn: isAuthorized, user: playerUser, logout } = useAuth();
    const { user } = useUser();
    const { hasPendingRequests } = usePendingUCRequests();
    const { theme, setTheme } = useTheme();

    // Track if promoter tab has been visited (to show "New" indicator)
    const [hasVisitedPromoter, setHasVisitedPromoter] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("bimon_promoter_tab_visited") === "true";
        }
        return false;
    });

    // Show new promoter indicator only for authenticated users who haven't visited
    const showPromoterNew = isAuthorized && !hasVisitedPromoter;

    // Ensure portal only renders on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Listen for storage changes (when profile page marks promoter as visited)
    useEffect(() => {
        const handleStorageChange = () => {
            const visited = localStorage.getItem("bimon_promoter_tab_visited") === "true";
            setHasVisitedPromoter(visited);
        };

        // Listen for storage events (cross-tab) and custom events (same-tab)
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("promoter-visited", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("promoter-visited", handleStorageChange);
        };
    }, []);

    // Close sidebar when navigation completes
    useEffect(() => {
        if (navigatingTo && pathname === navigatingTo && !isPending) {
            setIsOpen(false);
            setNavigatingTo(null);
        }
    }, [pathname, navigatingTo, isPending]);

    const onToggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const handleLogin = () => {
        setIsOpen(false);
        router.push("/auth");
    };

    const handleSignOut = async () => {
        setIsSigningOut(true);
        setIsOpen(false);
        try {
            // Use auth context's logout which sets isLoggingOut flag
            await logout();
        } catch (error) {
            console.error("Error signing out:", error);
            setIsSigningOut(false);
        }
    };

    // Disable body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleNavigation = (href: string) => {
        // If already on this page, just close the menu
        if (pathname === href) {
            setIsOpen(false);
            return;
        }

        // Set the navigation target and start the transition
        setNavigatingTo(href);
        startTransition(() => {
            router.push(href);
        });
    };

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
                <nav className="flex items-center space-x-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive(item.href)
                                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    {isAuthorized &&
                        authNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${isActive(item.href)
                                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                                    }`}
                            >
                                {item.label}
                                {item.showNotification && hasPendingRequests && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-zinc-900"></span>
                                )}
                            </Link>
                        ))}
                </nav>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                {/* User Actions */}
                <div className="flex items-center space-x-2">
                    {/* Royal Pass Button - Desktop */}
                    {isAuthorized && (
                        <button
                            onClick={() => router.push('/royal-pass')}
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200"
                            aria-label="Royal Pass"
                        >
                            <span className="relative inline-flex">
                                <Crown className="h-4 w-4" />
                                <span className="absolute inset-0 overflow-hidden pointer-events-none">
                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-[200%] -translate-x-full animate-[iconShine_1.5s_ease-in-out_1] [animation-delay:1s] mix-blend-overlay" />
                                </span>
                            </span>
                        </button>
                    )}

                    {/* Theme Toggle */}
                    <button
                        onClick={onToggleTheme}
                        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-200"
                        aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                    </button>

                    {/* Logout Button - Only show if authenticated */}
                    {isAuthorized && (
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-50"
                            aria-label="Logout"
                        >
                            {isSigningOut ? (
                                <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <FiLogOut className="h-4 w-4" />
                            )}
                        </button>
                    )}

                    {/* Login Button */}
                    {!isAuthorized && (
                        <button
                            onClick={handleLogin}
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            aria-label="Sign in with Google"
                        >
                            <FcGoogle className="h-4 w-4" />
                            <span>Sign in</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile: Royal Pass Button + Hamburger - Inline in header */}
            <div className="md:hidden flex items-center gap-1">
                {/* Royal Pass Button - subtle crown icon */}
                {isAuthorized && (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-amber-500 dark:text-amber-400"
                        onClick={() => router.push('/royal-pass')}
                        aria-label="Royal Pass"
                    >
                        <span className="relative inline-flex">
                            <Crown className="h-5 w-5" />
                            <span className="absolute inset-0 overflow-hidden pointer-events-none">
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent w-[200%] -translate-x-full animate-[iconShine_1.5s_ease-in-out_1] [animation-delay:0.5s] mix-blend-overlay" />
                            </span>
                        </span>
                    </motion.button>
                )}

                {/* Hamburger Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="p-2 relative"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isOpen ? (
                            <FiX className="h-6 w-6 text-gray-900 dark:text-white" />
                        ) : (
                            <FiMenu className="h-6 w-6 text-gray-900 dark:text-white" />
                        )}
                    </motion.div>
                    {(hasPendingRequests || showPromoterNew) && !isOpen && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    )}
                </motion.button>
            </div>

            {/* Mobile Menu Overlay */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[55] md:hidden"
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Slide-out menu panel */}
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 200, damping: 28 }}
                                className="fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white dark:bg-black border-l border-gray-100 dark:border-zinc-900 z-[60] md:hidden flex flex-col"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-zinc-900">
                                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        Menu
                                    </h2>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
                                    >
                                        <FiX className="h-5 w-5 text-gray-500 dark:text-gray-500" />
                                    </motion.button>
                                </div>

                                {/* Navigation */}
                                <nav className="flex-1 overflow-y-auto py-4">
                                    <div className="px-3 space-y-1">
                                        {navItems.map((item, index) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.href);
                                            const isNavigating = navigatingTo === item.href;
                                            const isAnyNavigating = navigatingTo !== null;
                                            return (
                                                <motion.button
                                                    key={item.href}
                                                    initial={{ opacity: 0, x: 12 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        delay: index * 0.04,
                                                        type: "spring",
                                                        stiffness: 200,
                                                        damping: 20
                                                    }}
                                                    onClick={() => handleNavigation(item.href)}
                                                    disabled={isAnyNavigating}
                                                    className={`w-full flex items-center gap-4 px-4 py-3.5 text-left rounded-xl transition-all ${active
                                                        ? "bg-gray-900 dark:bg-white text-white dark:text-black"
                                                        : isNavigating
                                                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
                                                        } ${isAnyNavigating && !isNavigating ? "opacity-50 cursor-not-allowed" : ""}`}
                                                >
                                                    {isNavigating ? (
                                                        <FiLoader className="h-5 w-5 animate-spin text-indigo-500 dark:text-indigo-400" />
                                                    ) : (
                                                        <Icon className={`h-5 w-5 ${active ? "text-white dark:text-black" : "text-gray-400 dark:text-gray-500"}`} />
                                                    )}
                                                    <span className="text-[15px] font-medium">{item.label}</span>
                                                    {active && !isNavigating && (
                                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                                                    )}
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                </nav>

                                {/* Footer Actions */}
                                <div className="mt-auto border-t border-gray-100 dark:border-zinc-900 p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-3">
                                    {/* Login Button for non-authenticated users */}
                                    {!isAuthorized && (
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleLogin}
                                            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
                                        >
                                            <FcGoogle className="h-5 w-5" />
                                            Sign in with Google
                                        </motion.button>
                                    )}

                                    {/* Top row: Theme toggle and Logout */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={onToggleTheme}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 transition-colors"
                                        >
                                            {theme === "dark" ? <FiSun className="h-4 w-4 text-gray-600 dark:text-gray-400" /> : <FiMoon className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {theme === "dark" ? "Light" : "Dark"}
                                            </span>
                                        </button>
                                        {isAuthorized && (
                                            <button
                                                onClick={handleSignOut}
                                                disabled={isSigningOut}
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                                                aria-label="Sign Out"
                                            >
                                                {isSigningOut ? (
                                                    <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <FiLogOut className="h-4 w-4" />
                                                )}
                                                <span className="text-sm font-medium">Logout</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Profile row for authenticated users */}
                                    {isAuthorized && (() => {
                                        const isNavigatingToProfile = navigatingTo === "/profile";
                                        const isAnyNavigating = navigatingTo !== null;
                                        return (
                                            <motion.button
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    delay: 0.15,
                                                    type: "spring",
                                                    stiffness: 200,
                                                    damping: 20
                                                }}
                                                onClick={() => handleNavigation("/profile")}
                                                disabled={isAnyNavigating}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all ${isNavigatingToProfile
                                                    ? "bg-indigo-50 dark:bg-indigo-900/20"
                                                    : "bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800"
                                                    } ${isAnyNavigating && !isNavigatingToProfile ? "opacity-50 cursor-not-allowed" : ""}`}
                                            >
                                                {isNavigatingToProfile ? (
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                                                        <FiLoader className="h-4 w-4 animate-spin text-indigo-500" />
                                                    </div>
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-zinc-700 relative flex-shrink-0">
                                                        {(playerUser as any)?.player?.characterImage?.publicUrl ? (
                                                            <Image
                                                                src={(playerUser as any).player.characterImage.publicUrl}
                                                                alt="Profile"
                                                                fill
                                                                sizes="40px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                                                <FiUser className="h-5 w-5 text-gray-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    {playerUser && (
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white block truncate">
                                                            {getDisplayName(playerUser.displayName, playerUser.userName)}
                                                        </span>
                                                    )}
                                                    {user?.primaryEmailAddress?.emailAddress && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                                                            {user.primaryEmailAddress.emailAddress}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isNavigatingToProfile && (hasPendingRequests || showPromoterNew) && (
                                                    <span className="h-2 w-2 rounded-full animate-pulse flex-shrink-0 bg-red-500"></span>
                                                )}
                                            </motion.button>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
