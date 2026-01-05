"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/src/components/ui/button";
import { IconDownload, IconX, IconShare } from "@tabler/icons-react";
import { posthog } from "@/src/components/provider/PostHogProvider";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Extend window type
declare global {
    interface Window {
        deferredPWAPrompt: BeforeInstallPromptEvent | null;
    }
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Disable on localhost (development)
        if (typeof window !== "undefined" && window.location.hostname === "localhost") {
            return;
        }

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS Safari
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
            !(window as unknown as { MSStream?: unknown }).MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

        if (isIOSDevice && isSafari) {
            setIsIOS(true);
            // Check if user dismissed before (only check for iOS)
            const dismissed = localStorage.getItem("pwa-ios-dismissed");
            if (dismissed) {
                const dismissedTime = parseInt(dismissed, 10);
                if (Date.now() - dismissedTime < 1 * 24 * 60 * 60 * 1000) {
                    return;
                }
            }
            setTimeout(() => setShowPrompt(true), 2000);
            return;
        }

        // Check for globally captured prompt (from inline script in layout.tsx)
        const checkForPrompt = () => {
            if (window.deferredPWAPrompt) {
                setDeferredPrompt(window.deferredPWAPrompt);

                // Check if was dismissed
                const dismissed = localStorage.getItem("pwa-install-dismissed");
                if (dismissed) {
                    const dismissedTime = parseInt(dismissed, 10);
                    if (Date.now() - dismissedTime < 1 * 24 * 60 * 60 * 1000) {
                        return;
                    }
                }

                setTimeout(() => setShowPrompt(true), 2000);
            }
        };

        // Check immediately and also after a delay (in case event fires later)
        checkForPrompt();
        const timer = setTimeout(checkForPrompt, 1000);

        // Also listen for new events (backup)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            window.deferredPWAPrompt = e as BeforeInstallPromptEvent;
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (dismissed) {
                const dismissedTime = parseInt(dismissed, 10);
                if (Date.now() - dismissedTime < 1 * 24 * 60 * 60 * 1000) {
                    return;
                }
            }

            setTimeout(() => setShowPrompt(true), 2000);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
            window.deferredPWAPrompt = null;
            localStorage.removeItem("pwa-install-dismissed");
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            clearTimeout(timer);
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        const prompt = deferredPrompt || window.deferredPWAPrompt;
        if (!prompt) return;

        await prompt.prompt();
        const { outcome } = await prompt.userChoice;

        if (outcome === "accepted") {
            setIsInstalled(true);
            window.deferredPWAPrompt = null;

            // Track PWA installation in PostHog
            posthog.capture("pwa_installed", {
                platform: /Android/.test(navigator.userAgent) ? "android" : "desktop",
                method: "browser_prompt",
            });
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    }, [deferredPrompt]);

    const handleDismiss = useCallback(() => {
        setShowPrompt(false);
        if (isIOS) {
            localStorage.setItem("pwa-ios-dismissed", Date.now().toString());
        } else {
            localStorage.setItem("pwa-install-dismissed", Date.now().toString());
        }
    }, [isIOS]);

    // Don't show if already installed
    if (isInstalled || !showPrompt) {
        return null;
    }

    // For non-iOS, also check for deferredPrompt
    if (!isIOS && !deferredPrompt && !window.deferredPWAPrompt) {
        return null;
    }

    // iOS Safari - show instruction banner
    if (isIOS) {
        return (
            <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
                <div className="rounded-xl border border-border/50 bg-card/95 p-4 shadow-2xl backdrop-blur-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <IconDownload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-foreground">Install App</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Tap <IconShare className="inline h-4 w-4 mx-0.5 -mt-0.5" /> Share, then <span className="font-medium">&quot;Add to Home Screen&quot;</span>
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Dismiss"
                        >
                            <IconX className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Android/Desktop - show install button
    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:left-auto md:right-4 md:w-80">
            <div className="rounded-xl border border-border/50 bg-card/95 p-4 shadow-2xl backdrop-blur-lg">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <IconDownload className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground">Install App</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Install PUBGMI for quick access & offline support
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Dismiss"
                    >
                        <IconX className="h-4 w-4" />
                    </button>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={handleDismiss}
                    >
                        Not now
                    </Button>
                    <Button size="sm" className="flex-1" onClick={handleInstall}>
                        <IconDownload className="mr-1.5 h-4 w-4" />
                        Install
                    </Button>
                </div>
            </div>
        </div>
    );
}
