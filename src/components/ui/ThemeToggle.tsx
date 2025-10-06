"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
    else if (saved === "light") setDarkMode(false);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setDarkMode(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="fixed right-3 top-3 sm:right-6 sm:top-6 z-50">
      <AnimatePresence initial={false} mode="wait">
        <motion.button
          key={darkMode ? "dark" : "light"}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="flex items-center gap-2 px-3 py-2 rounded-full border shadow-lg bg-white dark:bg-zinc-900 dark:text-white dark:border-zinc-700 border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 hover:scale-105 active:scale-95 transition-all"
          onClick={() => setDarkMode((d) => !d)}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Black Mode"}
        >
          {darkMode ? (
            <>
              <FiSun className="h-5 w-5" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <FiMoon className="h-5 w-5" />
              <span className="hidden sm:inline">Black Mode</span>
            </>
          )}
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
