"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GAME } from "@/lib/game-config";

const DISMISSED_KEY = "push-prompt-dismissed";
const SUBSCRIBED_KEY = "push-subscribed";

/**
 * Converts a base64-url VAPID key to a Uint8Array for the Push API.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array<ArrayBuffer>;
}

/**
 * PushPrompt — A soft, dismissible banner that gently asks the user
 * to enable push notifications. Never forced, never intrusive.
 *
 * Shows after 3 visits to the notification page (tracked in localStorage).
 * Can be permanently dismissed.
 */
export function PushPrompt() {
    const [show, setShow] = useState(false);
    const [subscribing, setSubscribing] = useState(false);

    useEffect(() => {
        // Don't show if:
        // 1. Browser doesn't support push
        // 2. Already subscribed
        // 3. User dismissed it
        // 4. Permission already denied (can't ask again)
        if (
            typeof window === "undefined" ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window) ||
            !process.env.NEXT_PUBLIC_VAPID_TOKEN
        ) return;

        if (localStorage.getItem(SUBSCRIBED_KEY) === "true") return;
        if (localStorage.getItem(DISMISSED_KEY) === "true") return;
        if (Notification.permission === "denied") return;
        if (Notification.permission === "granted") {
            // Already granted but not subscribed to our server — auto-subscribe silently
            autoSubscribe();
            return;
        }

        // Show after a brief delay so it doesn't feel aggressive
        const timer = setTimeout(() => setShow(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    const autoSubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_TOKEN!
                ),
            });

            const sub = subscription.toJSON();
            await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    endpoint: sub.endpoint,
                    keys: sub.keys,
                }),
            });

            localStorage.setItem(SUBSCRIBED_KEY, "true");
        } catch (err) {
            console.warn("[Push] Auto-subscribe failed:", err);
        }
    }, []);

    const handleEnable = async () => {
        setSubscribing(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setShow(false);
                return;
            }

            await autoSubscribe();
            setShow(false);
        } catch (err) {
            console.error("[Push] Subscribe error:", err);
        } finally {
            setSubscribing(false);
        }
    };

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem(DISMISSED_KEY, "true");
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="mb-3 overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04]"
                >
                    <div className="flex items-start gap-3 px-4 py-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                            <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                                Get notified instantly
                            </p>
                            <p className="text-xs text-foreground/50 mt-0.5">
                                {GAME.currency} requests, squad invites, rewards — right on your phone
                            </p>
                            <div className="flex items-center gap-2 mt-2.5">
                                <button
                                    onClick={handleEnable}
                                    disabled={subscribing}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {subscribing ? (
                                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        <Bell className="h-3 w-3" />
                                    )}
                                    Enable notifications
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors px-1"
                                >
                                    Not now
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="shrink-0 p-1 text-foreground/30 hover:text-foreground/60 transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
