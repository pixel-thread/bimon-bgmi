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
    FiAward,
    FiUser,
    FiShield,
    FiFileText,
    FiDollarSign,
    FiBarChart2,
    FiStar,
    FiChevronRight,
    FiLoader,
} from "react-icons/fi";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import Link from "next/link";
import { getDisplayName } from "@/src/utils/bgmiDisplay";

// Shared navigation items with icons for mobile
const navItems = [
    { href: "/", label: "Home", icon: FiHome },
    { href: "/about", label: "About", icon: FiInfo },
    { href: "/how-it-works", label: "How It Works", icon: FiHelpCircle },
    { href: "/tournament/players", label: "Balance", icon: FiDollarSign },
    { href: "/tournament/vote", label: "Vote", icon: FiBarChart2 },
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
    const { isSignedIn: isAuthorized, user: playerUser } = useAuth();
    const { user } = useUser();
    const { hasPendingRequests } = usePendingUCRequests();
    const { signOut } = useClerk();
    const { theme, setTheme } = useTheme();

    // Ensure portal only renders on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close sidebar when navigation completes
    useEffect(() => {
        if (navigatingTo && pathname === navigatingTo && !isPending) {
            setIsOpen(false);
            setNavigatingTo(null);
        }
    }, [pathname, navigatingTo, isPending]);

    // Display name guide state - show for old users without displayName
    const [showDisplayNameGuide, setShowDisplayNameGuide] = useState(false);

    useEffect(() => {
        if (playerUser && !playerUser.displayName && isAuthorized) {
            const dismissed = localStorage.getItem('displayNameGuideDismissed');
            if (!dismissed) {
                setShowDisplayNameGuide(true);
            }
        }
    }, [playerUser, isAuthorized]);

    const dismissDisplayNameGuide = () => {
        localStorage.setItem('displayNameGuideDismissed', 'true');
        setShowDisplayNameGuide(false);
    };

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
            await signOut();
            window.location.href = "/";
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
                                {item.showNotification && showDisplayNameGuide && !hasPendingRequests && (
                                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-white dark:border-zinc-900"></span>
                                )}
                            </Link>
                        ))}
                </nav>

                {/* Divider */}
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                {/* User Actions */}
                <div className="flex items-center space-x-2">
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
                            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            aria-label="Login"
                        >
                            <FiLogIn className="h-4 w-4" />
                            <span>Login</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Hamburger Button - Inline in header */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                className="md:hidden p-2"
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
                {hasPendingRequests && !isOpen && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
                {showDisplayNameGuide && !hasPendingRequests && !isOpen && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
                )}
            </motion.button>

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

                                    {/* Authenticated User Section */}
                                    {isAuthorized && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-900">
                                            <div className="px-3">
                                                {(() => {
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
                                                            className={`w-full flex items-center gap-4 px-4 py-3.5 text-left rounded-xl transition-all ${isNavigatingToProfile
                                                                ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
                                                                } ${isAnyNavigating && !isNavigatingToProfile ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        >
                                                            {isNavigatingToProfile ? (
                                                                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                                    <FiLoader className="h-4 w-4 animate-spin text-indigo-500" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-zinc-800 relative">
                                                                    {/* Priority: characterImage > user.imageUrl > fallback */}
                                                                    {(playerUser as any)?.player?.characterImage?.publicUrl ? (
                                                                        <Image
                                                                            src={(playerUser as any).player.characterImage.publicUrl}
                                                                            alt="Profile"
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : user?.imageUrl ? (
                                                                        <Image
                                                                            src={user.imageUrl}
                                                                            alt="Profile"
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                                                            <FiUser className="h-4 w-4 text-gray-500" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <span className="text-[15px] font-medium block">Profile</span>
                                                                {playerUser && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-600">{getDisplayName(playerUser.displayName, playerUser.userName)}</span>
                                                                )}
                                                            </div>

                                                            {!isNavigatingToProfile && hasPendingRequests && (
                                                                <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                                                            )}
                                                            {!isNavigatingToProfile && showDisplayNameGuide && !hasPendingRequests && (
                                                                <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                            )}
                                                        </motion.button>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </nav>

                                {/* Footer Actions */}
                                <div className="border-t border-gray-100 dark:border-zinc-900 p-4 space-y-2">
                                    {/* Theme Toggle */}
                                    <button
                                        onClick={onToggleTheme}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-zinc-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {theme === "dark" ? <FiSun className="h-4 w-4 text-gray-600 dark:text-gray-400" /> : <FiMoon className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {theme === "dark" ? "Light" : "Dark"}
                                            </span>
                                        </div>
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${theme === "dark" ? "bg-white" : "bg-gray-300"}`}>
                                            <motion.div
                                                layout
                                                className={`w-4 h-4 rounded-full shadow-sm ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                                animate={{ x: theme === "dark" ? 16 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </div>
                                    </button>

                                    {/* Login / Sign Out */}
                                    {!isAuthorized ? (
                                        <motion.button
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleLogin}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-medium transition-all hover:opacity-90"
                                        >
                                            <FiLogIn className="h-4 w-4" />
                                            Sign In
                                        </motion.button>
                                    ) : (
                                        <button
                                            onClick={handleSignOut}
                                            disabled={isSigningOut}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
                                        >
                                            {isSigningOut ? (
                                                <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <FiLogOut className="h-4 w-4" />
                                            )}
                                            <span className="text-sm">{isSigningOut ? "Signing out..." : "Sign Out"}</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Display Name Setup Guide - Floating Banner */}
            {mounted && showDisplayNameGuide && createPortal(
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
                >
                    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-4 shadow-2xl">
                        <button
                            onClick={dismissDisplayNameGuide}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
                            aria-label="Dismiss"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                        <div className="flex items-start gap-3 pr-6">
                            <div className="p-2 rounded-full bg-white/20 shrink-0">
                                <FiStar className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm mb-1">Set Your BGMI Display Name!</h3>
                                <p className="text-xs text-white/80 mb-2">
                                    Customize how your name appears with special characters. Go to Profile → Account Settings.
                                </p>
                                <button
                                    onClick={() => {
                                        dismissDisplayNameGuide();
                                        router.push('/profile');
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                                >
                                    Go to Profile
                                    <FiChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>,
                document.body
            )}
        </>
    );
}
