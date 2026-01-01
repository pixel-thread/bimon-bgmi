"use client";

import { Bell, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { usePushNotifications } from "@/src/hooks/push/usePushNotifications";
import { useState, useEffect } from "react";

const DISMISSED_KEY = "push-notification-prompt-dismissed-at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function NotificationPromptBanner() {
    const { isSupported, isSubscribed, isLoading, permission, subscribe } =
        usePushNotifications();
    const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash
    const [isPrompting, setIsPrompting] = useState(false);

    // Check localStorage on mount - show again after 24 hours
    useEffect(() => {
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const now = Date.now();
            // If 24 hours have passed, show the banner again
            if (now - dismissedTime > DISMISS_DURATION_MS) {
                localStorage.removeItem(DISMISSED_KEY);
                setIsDismissed(false);
            } else {
                setIsDismissed(true);
            }
        } else {
            setIsDismissed(false);
        }
    }, []);

    // Don't show if:
    // - Not supported
    // - Already subscribed
    // - Permission already denied (can't ask again)
    // - User dismissed the banner (within 24 hours)
    // - Still loading
    if (!isSupported || isSubscribed || permission === "denied" || isDismissed || isLoading) {
        return null;
    }

    const handleEnable = async () => {
        setIsPrompting(true);
        const success = await subscribe();
        setIsPrompting(false);
        if (success) {
            // Remove the dismiss timestamp since they enabled
            localStorage.removeItem(DISMISSED_KEY);
            setIsDismissed(true);
        }
    };

    const handleDismiss = () => {
        // Store the current timestamp
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        setIsDismissed(true);
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white px-3 py-3 sm:px-4 rounded-lg mb-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Icon and Text */}
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-full shrink-0">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base">Never miss a poll!</p>
                        <p className="text-xs sm:text-sm text-white/80 leading-snug">
                            Enable notifications to be alerted when new polls are available.
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleEnable}
                        disabled={isPrompting}
                        className="bg-white dark:bg-gray-100 text-purple-600 dark:text-purple-700 hover:bg-white/90 dark:hover:bg-gray-200 text-xs sm:text-sm px-3 sm:px-4"
                    >
                        {isPrompting ? "Enabling..." : "Enable"}
                    </Button>
                    <button
                        onClick={handleDismiss}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
