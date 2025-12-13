"use client";

import { useEffect, useRef } from "react";

// Ad formats for different placements
export type AdFormat =
    | "horizontal"  // 728x90 for desktop, responsive for mobile
    | "rectangle"   // 300x250 for sidebars
    | "vertical"    // 160x600 for sidebars
    | "in-feed";    // Responsive in-content

interface AdUnitProps {
    slot: string;           // Ad slot ID from env
    format?: AdFormat;
    className?: string;
    testMode?: boolean;     // Show placeholder in development
}

// Get slot ID from environment or fallback
export function getAdSlot(slotKey: string): string {
    const envKey = `NEXT_PUBLIC_AD_SLOT_${slotKey.toUpperCase()}`;
    return process.env[envKey] || "";
}

export function AdUnit({
    slot,
    format = "horizontal",
    className = "",
    testMode = process.env.NODE_ENV === "development"
}: AdUnitProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const isAdPushed = useRef(false);

    // Format-specific styles
    const formatStyles: Record<AdFormat, { minHeight: string; maxWidth: string }> = {
        horizontal: { minHeight: "90px", maxWidth: "728px" },
        rectangle: { minHeight: "250px", maxWidth: "300px" },
        vertical: { minHeight: "600px", maxWidth: "160px" },
        "in-feed": { minHeight: "100px", maxWidth: "100%" },
    };

    useEffect(() => {
        // Skip if no slot ID configured
        if (!slot) return;

        // Skip in test mode (development)
        if (testMode) return;

        // Push the ad only once
        if (isAdPushed.current) return;

        try {
            // @ts-expect-error - adsbygoogle is a global from Google's script
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            isAdPushed.current = true;
        } catch (error) {
            console.error("AdSense error:", error);
        }
    }, [slot, testMode]);

    // In production without a slot ID configured - render nothing
    if (!testMode && !slot) {
        return null;
    }

    // Development placeholder - only show in dev mode
    if (testMode) {
        return (
            <div
                className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg mx-auto ${className}`}
                style={{
                    minHeight: formatStyles[format].minHeight,
                    maxWidth: formatStyles[format].maxWidth,
                    width: "100%"
                }}
            >
                <div className="text-center text-slate-500 dark:text-slate-400 p-4">
                    <div className="text-sm font-medium mb-1">
                        📢 Ad Space
                    </div>
                    <div className="text-xs">
                        {slot ? `Slot: ${slot}` : "No slot configured"}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {format} format
                    </div>
                </div>
            </div>
        );
    }

    // Production ad unit
    return (
        <div
            ref={adRef}
            className={`overflow-hidden mx-auto ${className}`}
            style={{
                minHeight: formatStyles[format].minHeight,
                maxWidth: formatStyles[format].maxWidth,
                width: "100%"
            }}
        >
            <ins
                className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-2651043074081875"}
                data-ad-slot={slot}
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    );
}

// Pre-configured ad components for easy use
export function HorizontalAd({ className = "" }: { className?: string }) {
    const slot = process.env.NEXT_PUBLIC_AD_SLOT_HORIZONTAL || "";
    return <AdUnit slot={slot} format="horizontal" className={className} />;
}

export function RectangleAd({ className = "" }: { className?: string }) {
    const slot = process.env.NEXT_PUBLIC_AD_SLOT_RECTANGLE || "";
    return <AdUnit slot={slot} format="rectangle" className={className} />;
}

export function InFeedAd({ className = "" }: { className?: string }) {
    const slot = process.env.NEXT_PUBLIC_AD_SLOT_INFEED || "";
    return <AdUnit slot={slot} format="in-feed" className={className} />;
}

export function FooterAd({ className = "" }: { className?: string }) {
    const slot = process.env.NEXT_PUBLIC_AD_SLOT_FOOTER || "";
    return <AdUnit slot={slot} format="horizontal" className={`mt-8 ${className}`} />;
}
