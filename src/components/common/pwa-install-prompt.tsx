"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * PWA install banner — shows on all pages.
 * Dismissed for 1 week, then re-appears.
 * Hides automatically if already installed as PWA.
 */
export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Already installed as PWA
        if (window.matchMedia("(display-mode: standalone)").matches) return;

        // Check if dismissed within the last week
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
            const elapsed = Date.now() - Number(dismissedAt);
            if (elapsed < ONE_WEEK_MS) return;
            // Expired — clear it so we show again
            localStorage.removeItem(DISMISS_KEY);
        }

        setVisible(true);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
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
                <Download className="h-5 w-5 shrink-0 text-primary" />
                <p className="flex-1 text-sm text-foreground/80">
                    Install for faster access
                </p>
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
