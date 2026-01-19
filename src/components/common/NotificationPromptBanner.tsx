"use client";

import { Bell } from "lucide-react";
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
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const HIDE_NOT_NOW_SECONDS = 5; // Hide "Not Now" for 5 seconds

export function NotificationPromptBanner() {
    const { isSupported, isSubscribed, isLoading, permission, subscribe } =
        usePushNotifications();
    const [showModal, setShowModal] = useState(false);
    const [isPrompting, setIsPrompting] = useState(false);
    const [showNotNow, setShowNotNow] = useState(false);
    const [isBrave, setIsBrave] = useState(false);

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
    }, []);

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
        const success = await subscribe();
        setIsPrompting(false);
        if (success) {
            localStorage.removeItem(DISMISSED_KEY);
            setShowModal(false);
        }
    };

    const handleNotNow = () => {
        if (!showNotNow) return; // Can't dismiss yet
        // Store the current timestamp - will show again after 24 hours
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        setShowModal(false);
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
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg">
                            <Bell className="h-6 w-6 text-white" />
                        </div>
                        <DialogTitle className="text-xl text-gray-900 dark:text-white">Stay Updated!</DialogTitle>
                    </div>
                    <DialogDescription className="text-base text-gray-600 dark:text-gray-300">
                        Enable notifications to know when new polls are available.
                        You&apos;ll be the first to vote and never miss an opportunity!
                    </DialogDescription>
                    {isBrave && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 flex items-start gap-2">
                            <span className="text-base">💡</span>
                            <span>
                                <strong>Tip:</strong> When your browser asks for permission, select{" "}
                                <strong>&quot;forever&quot;</strong> to stay notified permanently.
                            </span>
                        </p>
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
                    <Button
                        onClick={handleEnable}
                        disabled={isPrompting}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                    >
                        {isPrompting ? "Enabling..." : "Enable Notifications"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
