"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
    try {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (!dismissedAt) return false;
        const dismissedDate = new Date(parseInt(dismissedAt));
        const now = new Date();
        const diffDays =
            (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays < DISMISS_DAYS;
    } catch {
        return false;
    }
}

function isAndroidMobile(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent.toLowerCase();
    // Must be Android AND a mobile device (not desktop Chrome/Brave/Edge)
    return /android/.test(ua) && /mobile/.test(ua);
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true
    );
}

// Store the deferred prompt globally so it survives React re-renders
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Listen for the event at module level (runs once)
if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e: Event) => {
        e.preventDefault();
        globalDeferredPrompt = e as BeforeInstallPromptEvent;
    });
}

export function PwaInstallPrompt() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show on Android mobile, not installed, not dismissed
        if (!isAndroidMobile() || isStandalone() || isDismissed()) return;

        // Check if we already have a deferred prompt
        if (globalDeferredPrompt) {
            setIsVisible(true);
            return;
        }

        // Also listen in case it fires after mount
        const handler = (e: Event) => {
            e.preventDefault();
            globalDeferredPrompt = e as BeforeInstallPromptEvent;
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        const installedHandler = () => {
            setIsVisible(false);
            globalDeferredPrompt = null;
        };
        window.addEventListener("appinstalled", installedHandler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", installedHandler);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!globalDeferredPrompt) return;
        await globalDeferredPrompt.prompt();
        const { outcome } = await globalDeferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsVisible(false);
            globalDeferredPrompt = null;
        }
    }, []);

    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        try {
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
        } catch {
            // localStorage not available
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-500"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <div className="mx-2 mb-2 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/95 via-purple-600/95 to-pink-600/95 p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    {/* App icon */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
                        <svg
                            className="h-7 w-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">
                            Install PUBGMI App
                        </p>
                        <p className="text-xs text-white/70 leading-tight">
                            Get the latest V2 app. Remove old version first!
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            onClick={handleDismiss}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            Later
                        </button>
                        <button
                            onClick={handleInstall}
                            className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-purple-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                        >
                            Install
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
