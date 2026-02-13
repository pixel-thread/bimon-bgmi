"use client";

import { useEffect, useState } from "react";

/**
 * OfflineIndicator - Shows a subtle banner when the app is offline.
 * 
 * This replaces the "redirect to offline.html" behavior for pages that ARE
 * cached. When a user is viewing a cached page offline, they see this banner
 * instead of being kicked to a dead-end page.
 * 
 * Automatically hides when connection is restored.
 */
export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check initial state
        if (!navigator.onLine) {
            setIsOffline(true);
            // Small delay to avoid flash on fast connections
            setTimeout(() => setIsVisible(true), 300);
        }

        const handleOffline = () => {
            setIsOffline(true);
            setTimeout(() => setIsVisible(true), 300);
        };

        const handleOnline = () => {
            setIsVisible(false);
            // Allow fade-out animation to complete
            setTimeout(() => setIsOffline(false), 400);
        };

        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);

        return () => {
            window.removeEventListener("offline", handleOffline);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))",
                left: "50%",
                transform: `translateX(-50%) translateY(${isVisible ? "0" : "20px"})`,
                opacity: isVisible ? 1 : 0,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: 9998,
                pointerEvents: "none",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    background: "rgba(0, 0, 0, 0.85)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                }}
            >
                <span
                    style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#f59e0b",
                        flexShrink: 0,
                    }}
                />
                Offline — viewing cached data
            </div>
        </div>
    );
}
