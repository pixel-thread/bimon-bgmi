"use client";
import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { SidebarMenuButton } from "@/src/components/ui/sidebar";

export function SidebarThemeToggle() {
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
        if (!mounted) return;
        if (darkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode, mounted]);

    if (!mounted) {
        return (
            <SidebarMenuButton size="lg" className="pointer-events-none opacity-50">
                <FiMoon className="h-4 w-4" />
                <span>Theme</span>
            </SidebarMenuButton>
        );
    }

    return (
        <SidebarMenuButton
            size="lg"
            onClick={() => setDarkMode((d) => !d)}
            className="cursor-pointer hover:bg-sidebar-accent transition-colors"
        >
            {darkMode ? (
                <>
                    <FiSun className="h-4 w-4" />
                    <span>Light Mode</span>
                </>
            ) : (
                <>
                    <FiMoon className="h-4 w-4" />
                    <span>Dark Mode</span>
                </>
            )}
        </SidebarMenuButton>
    );
}
