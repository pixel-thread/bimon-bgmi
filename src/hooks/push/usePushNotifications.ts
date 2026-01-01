"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as Uint8Array<ArrayBuffer>;
}

export type PushPermissionState = "granted" | "denied" | "default" | "unsupported";

export function usePushNotifications() {
    const { getToken } = useAuth();
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [permission, setPermission] = useState<PushPermissionState>("default");

    // Check if push notifications are supported and get current state
    useEffect(() => {
        const checkSupport = async () => {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                setIsSupported(false);
                setPermission("unsupported");
                setIsLoading(false);
                return;
            }

            setIsSupported(true);
            setPermission(Notification.permission as PushPermissionState);

            // Check if already subscribed
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (error) {
                console.error("Error checking push subscription:", error);
            }

            setIsLoading(false);
        };

        checkSupport();
    }, []);

    // Subscribe to push notifications
    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            console.error("Push notifications not supported");
            return false;
        }

        if (!VAPID_PUBLIC_KEY) {
            console.error("VAPID_PUBLIC_KEY is missing. Check your .env file.");
            return false;
        }

        setIsLoading(true);

        try {
            // Request notification permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult as PushPermissionState);

            if (permissionResult !== "granted") {
                setIsLoading(false);
                return false;
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;

            // Check if there's an existing subscription
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                await existingSubscription.unsubscribe();
            }

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // Send subscription to server
            const p256dhKey = subscription.getKey("p256dh");
            const authKey = subscription.getKey("auth");

            if (!p256dhKey || !authKey) {
                throw new Error("Failed to get subscription keys");
            }

            // Get auth token
            const token = await getToken();
            if (!token) {
                throw new Error("Not logged in - please sign in to enable notifications");
            }

            const response = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
                        auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to save subscription to server");
            }

            setIsSubscribed(true);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Error subscribing to push:", error);
            setIsLoading(false);
            return false;
        }
    }, [isSupported, getToken]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from browser
                await subscription.unsubscribe();

                // Get auth token
                const token = await getToken();

                // Remove from server (only if logged in)
                if (token) {
                    await fetch("/api/push/unsubscribe", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({ endpoint: subscription.endpoint }),
                    });
                }
            }

            setIsSubscribed(false);
            setIsLoading(false);
            return true;
        } catch (error) {
            console.error("Error unsubscribing from push:", error);
            setIsLoading(false);
            return false;
        }
    }, [isSupported, getToken]);

    // Toggle subscription
    const toggle = useCallback(async (): Promise<boolean> => {
        if (isSubscribed) {
            return unsubscribe();
        } else {
            return subscribe();
        }
    }, [isSubscribed, subscribe, unsubscribe]);

    return {
        isSupported,
        isSubscribed,
        isLoading,
        permission,
        subscribe,
        unsubscribe,
        toggle,
    };
}
