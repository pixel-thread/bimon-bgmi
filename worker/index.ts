/// <reference lib="webworker" />

// Custom service worker extensions for push notifications and update handling
// This file is injected into the generated service worker by next-pwa

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw = self as unknown as ServiceWorkerGlobalScope;

// Handle SKIP_WAITING message from the client
// This allows manual control over when the new service worker activates
sw.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        sw.skipWaiting();
    }
});

// Extended notification options for service workers
interface ExtendedNotificationOptions extends NotificationOptions {
    actions?: Array<{ action: string; title: string }>;
    vibrate?: number[];
}

// Push notification event - display the notification
sw.addEventListener("push", (event) => {
    const data = event.data?.json() || {};

    const options: ExtendedNotificationOptions = {
        body: data.body || "New update available",
        icon: "/android-chrome-192x192.png",
        badge: "/android-chrome-192x192.png",
        data: {
            url: data.url || "/vote",
        },
        actions: [
            {
                action: "open",
                title: "Open",
            },
            {
                action: "close",
                title: "Dismiss",
            },
        ],
    };

    event.waitUntil(
        sw.registration.showNotification(data.title || "Bimon BGMI", options)
    );
});

// Handle notification click
sw.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "close") {
        return;
    }

    // Open the app or focus existing window
    const urlToOpen = (event.notification.data as { url?: string })?.url || "/";

    event.waitUntil(
        sw.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes(sw.location.origin) && "focus" in client) {
                        (client as WindowClient).navigate(urlToOpen);
                        return (client as WindowClient).focus();
                    }
                }
                // Open a new window
                if (sw.clients.openWindow) {
                    return sw.clients.openWindow(urlToOpen);
                }
                return undefined;
            })
    );
});
