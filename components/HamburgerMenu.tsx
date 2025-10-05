"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogIn,
  FiLogOut,
  FiSun,
  FiMoon,
} from "react-icons/fi";
// Notifications removed

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { isAuthorized, authType, playerUser, logout } = useAuth();

  // Force re-render when auth state changes
  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    setAuthKey((prev) => prev + 1);
  }, [isAuthorized, authType, playerUser]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
    else if (saved === "light") setDarkMode(false);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches)
      setDarkMode(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (darkMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  }, [darkMode, mounted]);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts

    try {
      setIsLoggingOut(true);
      await logout();
      setIsOpen(false);
      // Set flag to prevent immediate redirect back
      sessionStorage.setItem("just_logged_out", "true");
      // Force a complete page reload to ensure fresh state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const handleLogin = () => {
    setIsOpen(false);
    router.push("/login");
  };

  const handleProfile = () => {
    setIsOpen(false);
    router.push("/profile");
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Hamburger Button */}
      <button
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOpen ? "close" : "menu"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <FiX className="h-6 w-6 text-gray-900 dark:text-white" />
            ) : (
              <FiMenu className="h-6 w-6 text-gray-900 dark:text-white" />
            )}
          </motion.div>
        </AnimatePresence>
      </button>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-64 bg-white dark:bg-zinc-900 shadow-xl z-50 md:hidden"
            >
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  {" "}
                  Menu
                </h2>

                <nav className="space-y-2">
                  {/* Main Navigation Links */}
                  <div className="space-y-1 pb-4 border-b border-gray-200 dark:border-zinc-700">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      Home
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/about");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      About
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/how-it-works");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      How It Works
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/tournament");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      Tournament
                    </button>
                  </div>

                  {/* User Actions */}
                  {/* Login/Logout Button */}
                  {isAuthorized ? (
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoggingOut ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                      ) : (
                        <FiLogOut className="h-5 w-5" />
                      )}
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  ) : (
                    <button
                      onClick={handleLogin}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <FiLogIn className="h-5 w-5" />
                      Login
                    </button>
                  )}

                  {/* Profile Button - Only show if authenticated */}
                  {isAuthorized && (
                    <button
                      onClick={handleProfile}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <FiUser className="h-5 w-5" />
                      Profile
                    </button>
                  )}

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    {darkMode ? (
                      <>
                        <FiSun className="h-5 w-5" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <FiMoon className="h-5 w-5" />
                        Dark Mode
                      </>
                    )}
                  </button>

                  {/* Legal Pages */}
                  <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-4">
                      Legal
                    </p>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/privacy");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      Privacy Policy
                    </button>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push("/terms");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      Terms of Service
                    </button>
                  </div>

                  {/* User Info - Show if authenticated */}
                  {isAuthorized && playerUser && (
                    <div className="pt-4 border-t border-gray-200 dark:border-zinc-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Logged in as:
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {playerUser.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {authType === "player" ? "Player" : "Admin"}
                      </p>
                    </div>
                  )}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
