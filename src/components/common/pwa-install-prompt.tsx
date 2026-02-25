"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if Android
        const ua = navigator.userAgent.toLowerCase();
        const android = /android/.test(ua);
        setIsAndroid(android);

        if (!android) return;

        // Check if already installed as PWA
        const isStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as unknown as { standalone?: boolean }).standalone === true;
        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const dismissedDate = new Date(parseInt(dismissedAt));
            const now = new Date();
            const diffDays =
                (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays < DISMISS_DAYS) return;
        }

        // Listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Also listen for app installed
        const installedHandler = () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
        };
        window.addEventListener("appinstalled", installedHandler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", installedHandler);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsVisible(false);
            setDeferredPrompt(null);
        }
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setIsVisible(false);
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
    }, []);

    if (!isAndroid || !isVisible || isInstalled) return null;

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
