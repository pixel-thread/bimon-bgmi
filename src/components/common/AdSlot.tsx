"use client";

import { useEffect, useRef, useState } from "react";

declare global {
    interface Window {
        adsbygoogle?: Array<Record<string, unknown>>;
    }
}

interface AdSlotProps {
    /** AdSense ad slot ID (from your AdSense dashboard). Leave empty until you create ad units. */
    slot?: string;
    /** Ad format: "in-feed" blends into lists, "banner" is a standard rectangle */
    format?: "in-feed" | "banner";
    /** Extra CSS classes on the outer wrapper */
    className?: string;
    /** Delay in ms before attempting to load the ad (default: 2000ms — lets real content load first) */
    delay?: number;
}

/**
 * Non-intrusive AdSense ad slot.
 * - Delays loading so player data always loads first
 * - Collapses to 0 height if no ad loads (no empty space)
 * - Only renders client-side
 * - Safe to place anywhere — won't break layout
 */
export function AdSlot({ slot, format = "in-feed", className, delay = 2000 }: AdSlotProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const [hasAd, setHasAd] = useState(false);
    const [ready, setReady] = useState(false);
    const pushed = useRef(false);

    // Delay rendering so real content (players, polls) loads first
    useEffect(() => {
        const timer = setTimeout(() => setReady(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    // Push ad only after delay and when slot is configured
    useEffect(() => {
        if (!slot || !ready || pushed.current) return;

        const timer = setTimeout(() => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                pushed.current = true;
            } catch {
                // AdSense not ready or blocked — fail silently
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [slot, ready]);

    // Observe if an ad actually rendered (iframe appeared)
    useEffect(() => {
        if (!ready) return;
        const container = adRef.current;
        if (!container) return;

        const observer = new MutationObserver(() => {
            const iframe = container.querySelector("iframe");
            if (iframe && iframe.clientHeight > 0) {
                setHasAd(true);
                observer.disconnect();
            }
        });

        observer.observe(container, { childList: true, subtree: true });

        const check = setTimeout(() => {
            const iframe = container.querySelector("iframe");
            if (iframe && iframe.clientHeight > 0) {
                setHasAd(true);
            }
        }, 3000);

        return () => {
            observer.disconnect();
            clearTimeout(check);
        };
    }, [ready]);

    // Not ready yet or no slot — render nothing
    if (!slot || !ready) return null;

    return (
        <div
            ref={adRef}
            className={className}
            style={{
                overflow: "hidden",
                maxHeight: hasAd ? "none" : 0,
                opacity: hasAd ? 1 : 0,
                transition: "max-height 0.3s ease, opacity 0.3s ease",
            }}
        >
            <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-2651043074081875"
                data-ad-slot={slot}
                data-ad-format={format === "in-feed" ? "fluid" : "auto"}
                data-ad-layout-key={format === "in-feed" ? "-6t+ed+2i-1n-4w" : undefined}
                data-full-width-responsive="true"
            />
        </div>
    );
}
