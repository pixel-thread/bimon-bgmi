/// <reference lib="webworker" />

// Custom service worker extensions for push notifications and update handling
// This file is injected into the generated service worker by next-pwa

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw = self as unknown as ServiceWorkerGlobalScope;

// =============================================================================
// CRITICAL: Global error handlers to prevent app freeze on deployment updates
// =============================================================================
// When a new deployment happens with a different worker hash, the old service
// worker may try to importScripts() a file that no longer exists. This causes
// a NetworkError that freezes the app. These handlers catch that and recover.

/**
 * Handle synchronous errors (including importScripts failures)
 */
sw.addEventListener("error", (event) => {
    const message = event.message || "";
    const isImportError =
        message.includes("importScripts") ||
        message.includes("NetworkError") ||
        message.includes("Failed to fetch");

    if (isImportError) {
        console.error("[SW] Critical importScripts error detected, recovering...", message);
        recoverFromCriticalError();
    }
});

/**
 * Handle promise rejections (for async import failures)
 */
sw.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason?.message || String(event.reason || "");
    const isImportError =
        reason.includes("importScripts") ||
        reason.includes("NetworkError") ||
        reason.includes("Failed to fetch") ||
        reason.includes("Module") && reason.includes("didn't register");

    if (isImportError) {
        console.error("[SW] Critical promise rejection detected, recovering...", reason);
        recoverFromCriticalError();
    }
});

/**
 * Gracefully recover from a critical service worker error:
 * 1. Unregister this broken service worker
 * 2. Clear all caches to ensure fresh content
 * 3. Reload all open tabs/windows
 */
async function recoverFromCriticalError() {
    try {
        // Unregister this service worker
        await sw.registration.unregister();
        console.log("[SW] Service worker unregistered");

        // Clear all caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log("[SW] All caches cleared");

        // Reload all clients (tabs/windows)
        const clients = await sw.clients.matchAll({ type: "window" });
        for (const client of clients) {
            if ("navigate" in client) {
                (client as WindowClient).navigate(client.url);
            }
        }
        console.log("[SW] All clients reloaded");
    } catch (err) {
        console.error("[SW] Error during recovery:", err);
        // Last resort: just reload all clients
        const clients = await sw.clients.matchAll({ type: "window" });
        clients.forEach(client => {
            client.postMessage({ type: "FORCE_RELOAD" });
        });
    }
}

// =============================================================================
// End of error handlers
// =============================================================================

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

// Handle Share Target - intercept POST to /api/share-target
sw.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Only handle share target POST requests
    if (url.pathname === "/api/share-target" && event.request.method === "POST") {
        event.respondWith(
            (async () => {
                try {
                    const formData = await event.request.formData();
                    const images = formData.getAll("images") as File[];

                    if (images.length > 0) {
                        // Store images in cache for the client page to retrieve
                        const cache = await caches.open("share-target-cache");

                        // Store each image individually
                        const cacheFormData = new FormData();
                        images.forEach((img) => cacheFormData.append("images", img));

                        await cache.put(
                            "/shared-images",
                            new Response(cacheFormData)
                        );

                        // Redirect to recent-matches with flag
                        return Response.redirect(
                            `${url.origin}/admin/recent-matches?shared=${images.length}`,
                            303
                        );
                    }
                } catch (err) {
                    console.error("Share target error:", err);
                }

                // Fallback redirect
                return Response.redirect(`${url.origin}/admin/recent-matches`, 303);
            })()
        );
    }
});
