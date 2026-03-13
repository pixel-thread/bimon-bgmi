"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { GAME, GAME_MODE } from "@/lib/game-config";

const ICON_DIRS: Record<string, string> = { freefire: "freefire", pes: "pes" };
const PWA_ICON = `/icons/${ICON_DIRS[GAME_MODE] ?? "bgmi"}/icon-192x192.png`;

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * PWA install banner — mobile-only.
 * Shows the app icon + game name (e.g. "Install PUBGMI").
 * Dismissed for 1 week, then re-appears.
 * Hides if already installed as PWA or on desktop.
 */
export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show on mobile devices (not desktops/laptops including Mac)
        const isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
        if (!isMobile) return;

        // Already installed as PWA (standalone mode)
        if (window.matchMedia("(display-mode: standalone)").matches) return;
        // iOS standalone check
        if ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) return;

        // Check if dismissed within the last week
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const elapsed = Date.now() - Number(dismissedAt);
            if (elapsed < ONE_WEEK_MS) return;
            localStorage.removeItem(DISMISS_KEY);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Listen for app installed -> hide
        const installed = () => setVisible(false);
        window.addEventListener("appinstalled", installed);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", installed);
        };
    }, []);

    if (!visible || !deferredPrompt) return null;

    const handleInstall = async () => {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setVisible(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
    };

    return (
        <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[slideUp_0.3s_ease-out] lg:bottom-6">
            <div className="flex items-center gap-3 rounded-xl border border-divider bg-background/90 px-4 py-3 shadow-lg backdrop-blur-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={PWA_ICON}
                    alt={GAME.name}
                    className="h-8 w-8 shrink-0 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/90 truncate">
                        Install {GAME.name}
                    </p>
                    <p className="text-[10px] text-foreground/40">
                        For faster access
                    </p>
                </div>
                <button
                    onClick={handleInstall}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                    Install
                </button>
                <button
                    onClick={handleDismiss}
                    className="shrink-0 rounded-full p-1 text-foreground/40 transition-colors hover:text-foreground/70"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
