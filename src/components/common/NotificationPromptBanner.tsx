"use client";

import { Bell, Settings, ExternalLink } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { usePushNotifications } from "@/src/hooks/push/usePushNotifications";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";

const DISMISSED_KEY = "push-notification-prompt-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const HIDE_NOT_NOW_SECONDS = 5; // Hide "Not Now" for 5 seconds

export function NotificationPromptBanner() {
    const { isSupported, isSubscribed, isLoading, permission, subscribe } =
        usePushNotifications();
    const [showModal, setShowModal] = useState(false);
    const [isPrompting, setIsPrompting] = useState(false);
    const [showNotNow, setShowNotNow] = useState(false);
    const [isBrave, setIsBrave] = useState(false);
    const [isPWA, setIsPWA] = useState(false);
    const [showManualInstructions, setShowManualInstructions] = useState(false);
    const [promptFailed, setPromptFailed] = useState(false);

    // Detect if running as installed PWA
    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
        setIsPWA(isStandalone);
    }, []);

    // Detect Brave browser (has granular permission options)
    useEffect(() => {
        const checkBrave = async () => {
            // @ts-expect-error - Brave exposes this API
            if (navigator.brave && await navigator.brave.isBrave()) {
                setIsBrave(true);
            }
        };
        checkBrave();
    }, []);

    // Check localStorage on mount - show again after 24 hours
    useEffect(() => {
        // Wait for subscription check to complete
        if (isLoading) return;

        // Don't show if already subscribed
        if (isSubscribed) return;

        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const now = Date.now();
            // If 24 hours have passed, show the modal again
            if (now - dismissedTime > DISMISS_DURATION_MS) {
                localStorage.removeItem(DISMISSED_KEY);
                setShowModal(true);
            }
        } else {
            // First time visitor - show modal
            setShowModal(true);
        }
    }, [isLoading, isSubscribed]);

    // Timer to show "Not Now" button after delay
    useEffect(() => {
        if (!showModal) return;

        const timer = setTimeout(() => {
            setShowNotNow(true);
        }, HIDE_NOT_NOW_SECONDS * 1000);

        return () => clearTimeout(timer);
    }, [showModal]);

    // Don't show modal if:
    // - Not supported
    // - Already subscribed
    // - Permission already denied (can't ask again)
    // - Still loading
    // - On localhost (development)
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const shouldShow = isSupported && !isSubscribed && permission !== "denied" && !isLoading && showModal && !isLocalhost;

    const handleEnable = async () => {
        setIsPrompting(true);
        setPromptFailed(false);

        // For Brave PWA, the native prompt may not appear at all
        // We'll use a timeout to detect if the prompt was blocked/suppressed
        const beforePermission = Notification.permission;

        const success = await subscribe();
        setIsPrompting(false);

        const afterPermission = Notification.permission;

        if (success) {
            localStorage.removeItem(DISMISSED_KEY);
            setShowModal(false);
        } else {
            // If permission didn't change and we're in Brave PWA, the prompt was likely blocked
            if (beforePermission === afterPermission && afterPermission === "default") {
                // Prompt was likely blocked/suppressed by Brave in PWA mode
                if (isBrave && isPWA) {
                    setPromptFailed(true);
                    setShowManualInstructions(true);
                }
            }
        }
    };

    const handleNotNow = () => {
        if (!showNotNow) return; // Can't dismiss yet
        // Store the current timestamp - will show again after 24 hours
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        setShowModal(false);
        setShowManualInstructions(false);
        setPromptFailed(false);
    };

    // Open browser settings for notifications (this opens in a new tab)
    const openBrowserSettings = () => {
        // For Brave/Chrome, we can open the site settings directly
        // This creates a URL that opens the site settings page
        const siteSettingsUrl = `brave://settings/content/siteDetails?site=${encodeURIComponent(window.location.origin)}`;

        // Copy the URL to clipboard since direct navigation to brave:// URLs is blocked
        navigator.clipboard.writeText(siteSettingsUrl).then(() => {
            alert(
                "Settings URL copied to clipboard!\n\n" +
                "Paste this in your browser's address bar:\n" +
                siteSettingsUrl + "\n\n" +
                "Then find 'Notifications' and change it to 'Allow'"
            );
        }).catch(() => {
            // Fallback: show instructions
            alert(
                "To enable notifications manually:\n\n" +
                "1. Tap the lock icon or three dots (⋮) in your browser\n" +
                "2. Select 'Site settings' or 'Settings'\n" +
                "3. Find 'Notifications'\n" +
                "4. Change to 'Allow'\n" +
                "5. Refresh the app"
            );
        });
    };

    if (!shouldShow) {
        return null;
    }

    return (
        <Dialog open={shouldShow} onOpenChange={(open) => !open && showNotNow && handleNotNow()}>
            <DialogContent
                className="sm:max-w-md [&>button]:hidden bg-white dark:bg-gray-900 border dark:border-gray-800"
                onPointerDownOutside={(e) => !showNotNow && e.preventDefault()}
                onEscapeKeyDown={(e) => !showNotNow && e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-3 rounded-full shadow-lg ${showManualInstructions ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}>
                            {showManualInstructions ? (
                                <Settings className="h-6 w-6 text-white" />
                            ) : (
                                <Bell className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <DialogTitle className="text-xl text-gray-900 dark:text-white">
                            {showManualInstructions ? "Enable Manually" : "Stay Updated!"}
                        </DialogTitle>
                    </div>

                    {showManualInstructions ? (
                        <>
                            <DialogDescription className="text-base text-gray-600 dark:text-gray-300">
                                Brave browser blocked the notification prompt in PWA mode.
                                You need to enable notifications manually through browser settings.
                            </DialogDescription>
                            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                                    Steps to enable:
                                </h4>
                                <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-2 list-decimal list-inside">
                                    <li>Open this site in Brave browser (not as installed app)</li>
                                    <li>Tap the <strong>lock icon</strong> or <strong>three dots (⋮)</strong> in the address bar</li>
                                    <li>Select <strong>&quot;Site settings&quot;</strong></li>
                                    <li>Find <strong>&quot;Notifications&quot;</strong> and set it to <strong>&quot;Allow&quot;</strong></li>
                                    <li>Come back to the app and refresh</li>
                                </ol>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                After enabling notifications in browser settings, the app will be able to send you updates.
                            </p>
                        </>
                    ) : (
                        <>
                            <DialogDescription className="text-base text-gray-600 dark:text-gray-300">
                                Enable notifications to know when new polls are available.
                                You&apos;ll be the first to vote and never miss an opportunity!
                            </DialogDescription>
                            {isBrave && !isPWA && (
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-2">
                                    <span className="text-base">💡</span>
                                    <span>
                                        <strong>Tip:</strong> When your browser asks for permission, select{" "}
                                        <strong>&quot;forever&quot;</strong> to stay notified permanently.
                                    </span>
                                </p>
                            )}
                            {isBrave && isPWA && (
                                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-2">
                                    <span className="text-base">⚠️</span>
                                    <span>
                                        <strong>Note:</strong> If the permission prompt doesn&apos;t appear,
                                        you may need to enable notifications manually in browser settings.
                                    </span>
                                </p>
                            )}
                        </>
                    )}
                </DialogHeader>

                <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                    {showNotNow && (
                        <Button
                            variant="outline"
                            onClick={handleNotNow}
                            disabled={isPrompting}
                            className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Not Now
                        </Button>
                    )}
                    {showManualInstructions ? (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => setShowManualInstructions(false)}
                                className="w-full sm:w-auto border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                Try Again
                            </Button>
                            <Button
                                onClick={openBrowserSettings}
                                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in Browser
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleEnable}
                            disabled={isPrompting}
                            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                        >
                            {isPrompting ? "Enabling..." : "Enable Notifications"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
