"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

/**
 * Simple PWA install banner — "Install for faster access".
 * Only render this on the landing page (/).
 */
export function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        // Already dismissed by user
        if (localStorage.getItem(DISMISS_KEY)) return;

        // Already installed as PWA
        if (window.matchMedia("(display-mode: standalone)").matches) return;

        setDismissed(false);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    if (dismissed || !deferredPrompt) return null;

    const handleInstall = async () => {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDismissed(true);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem(DISMISS_KEY, "1");
    };

    return (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[slideUp_0.3s_ease-out]">
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
