"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { IconDownload, IconShare } from "@tabler/icons-react";
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

// DEMO MODE: Set to true to always show on homepage (for testing)
const DEMO_MODE = false;

export function InstallPrompt() {
    const pathname = usePathname();
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showNotNow, setShowNotNow] = useState(false);

    // Only show on homepage
    const isHomePage = pathname === "/";

    useEffect(() => {
        // Only show on homepage
        if (!isHomePage) {
            setShowPrompt(false);
            return;
        }

        // Disable on localhost (development) - unless demo mode
        if (!DEMO_MODE && typeof window !== "undefined" && window.location.hostname === "localhost") {
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
            // DEMO MODE: Skip dismissal check
            if (!DEMO_MODE) {
                const dismissed = localStorage.getItem("pwa-ios-dismissed");
                if (dismissed) {
                    const dismissedTime = parseInt(dismissed, 10);
                    if (Date.now() - dismissedTime < 1 * 24 * 60 * 60 * 1000) {
                        return;
                    }
                }
            }
            // Show prompt immediately, but "Not now" after 5 seconds
            setShowPrompt(true);
            setTimeout(() => setShowNotNow(true), 5000);
            return;
        }

        // Check for globally captured prompt (from inline script in layout.tsx)
        const checkForPrompt = () => {
            // DEMO MODE: Always show even without browser prompt
            if (DEMO_MODE) {
                setShowPrompt(true);
                setTimeout(() => setShowNotNow(true), 5000);
                return;
            }

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

                // Show prompt immediately, but "Not now" after 5 seconds
                setShowPrompt(true);
                setTimeout(() => setShowNotNow(true), 5000);
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

            if (!DEMO_MODE) {
                const dismissed = localStorage.getItem("pwa-install-dismissed");
                if (dismissed) {
                    const dismissedTime = parseInt(dismissed, 10);
                    if (Date.now() - dismissedTime < 1 * 24 * 60 * 60 * 1000) {
                        return;
                    }
                }
            }

            // Show prompt immediately, but "Not now" after 5 seconds
            setShowPrompt(true);
            setTimeout(() => setShowNotNow(true), 5000);
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
    }, [isHomePage]);

    const handleInstall = useCallback(async () => {
        const prompt = deferredPrompt || window.deferredPWAPrompt;
        if (!prompt) {
            // DEMO MODE: Just hide the prompt if no actual install available
            setShowPrompt(false);
            return;
        }

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
        if (!DEMO_MODE) {
            if (isIOS) {
                localStorage.setItem("pwa-ios-dismissed", Date.now().toString());
            } else {
                localStorage.setItem("pwa-install-dismissed", Date.now().toString());
            }
        }
    }, [isIOS]);

    // Don't show if not on homepage
    if (!isHomePage) {
        return null;
    }

    // Don't show if already installed or prompt not ready
    if (isInstalled || !showPrompt) {
        return null;
    }

    // For non-iOS, also check for deferredPrompt (skip in demo mode)
    if (!DEMO_MODE && !isIOS && !deferredPrompt && !window.deferredPWAPrompt) {
        return null;
    }

    // iOS Safari - show instruction modal
    if (isIOS) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="mx-4 w-full max-w-sm rounded-2xl border border-border/50 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                            <IconDownload className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-foreground">Install App</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Tap <IconShare className="inline h-4 w-4 mx-0.5 -mt-0.5" /> Share, then <span className="font-medium">&quot;Add to Home Screen&quot;</span>
                        </p>
                    </div>
                    {showNotNow && (
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleDismiss}
                            >
                                Not now
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Android/Desktop - show install modal
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="mx-4 w-full max-w-sm rounded-2xl border border-border/50 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                        <IconDownload className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-foreground">Install App</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Install PUBGMI for quick access
                    </p>
                </div>
                <div className="mt-6 space-y-3">
                    <Button className="w-full" onClick={handleInstall}>
                        <IconDownload className="mr-2 h-4 w-4" />
                        Install
                    </Button>
                    {showNotNow && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleDismiss}
                        >
                            Not now
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
