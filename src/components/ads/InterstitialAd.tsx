"use client";

import { useEffect, useRef, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

interface InterstitialAdProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export function InterstitialAd({
    isOpen,
    onClose,
    title = "Continue Playing"
}: InterstitialAdProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const isAdPushed = useRef(false);
    const [countdown, setCountdown] = useState(5);
    const [canSkip, setCanSkip] = useState(false);

    const slotId = process.env.NEXT_PUBLIC_AD_SLOT_INTERSTITIAL || "";
    const isTestMode = process.env.NODE_ENV === "development" || !slotId;

    // Countdown timer
    useEffect(() => {
        if (!isOpen) {
            setCountdown(5);
            setCanSkip(false);
            return;
        }

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setCanSkip(true);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen]);

    // Load ad
    useEffect(() => {
        if (!isOpen || isTestMode || isAdPushed.current || !slotId) return;

        try {
            // @ts-expect-error - adsbygoogle is a global
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            isAdPushed.current = true;
        } catch (error) {
            console.error("Interstitial ad error:", error);
        }
    }, [isOpen, isTestMode, slotId]);

    // Reset ad state when closed
    useEffect(() => {
        if (!isOpen) {
            isAdPushed.current = false;
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && canSkip && onClose()}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-center">{title}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    {/* Ad Container */}
                    <div
                        ref={adRef}
                        className="w-full min-h-[250px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden"
                    >
                        {isTestMode ? (
                            // Development placeholder
                            <div className="text-center text-slate-500 dark:text-slate-400 p-6">
                                <div className="text-4xl mb-2">📺</div>
                                <div className="text-sm font-medium mb-1">
                                    Interstitial Ad
                                </div>
                                <div className="text-xs">
                                    {slotId ? `Slot: ${slotId}` : "No slot configured"}
                                </div>
                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                    Shows every 3 game retries
                                </div>
                            </div>
                        ) : (
                            // Production ad
                            <ins
                                className="adsbygoogle"
                                style={{ display: "block", width: "300px", height: "250px" }}
                                data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-2651043074081875"}
                                data-ad-slot={slotId}
                                data-ad-format="auto"
                            />
                        )}
                    </div>

                    {/* Skip/Continue Button */}
                    <Button
                        onClick={onClose}
                        disabled={!canSkip}
                        className="w-full"
                        variant={canSkip ? "default" : "secondary"}
                    >
                        {canSkip ? (
                            "Continue Playing 🎮"
                        ) : (
                            `Skip in ${countdown}s...`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Hook to manage interstitial ad logic
export function useInterstitialAd(retryThreshold = 3) {
    const [showAd, setShowAd] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Check if ads are configured - in production without slot, don't show ads
    const slotId = process.env.NEXT_PUBLIC_AD_SLOT_INTERSTITIAL || "";
    const isProduction = process.env.NODE_ENV === "production";
    const shouldShowAds = !isProduction || !!slotId;

    const recordRetry = () => {
        // In production without slot configured, never show ads
        if (!shouldShowAds) {
            return false;
        }

        const newCount = retryCount + 1;
        setRetryCount(newCount);

        // Show ad every N retries
        if (newCount >= retryThreshold) {
            setShowAd(true);
            setRetryCount(0); // Reset counter
            return true; // Ad will be shown
        }
        return false; // No ad
    };

    const closeAd = () => {
        setShowAd(false);
    };

    return {
        showAd,
        retryCount,
        recordRetry,
        closeAd,
    };
}
