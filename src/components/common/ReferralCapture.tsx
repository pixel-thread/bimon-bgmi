"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const REFERRAL_KEY = "referralCode";
const REFERRAL_EXPIRY_DAYS = 7;

interface ReferralData {
    code: string;
    expiresAt: number;
}

/**
 * Captures referral code from URL (?ref=CODE) and stores in localStorage
 * with a 7-day expiry. Used to track which promoter referred the user.
 */
export function ReferralCapture() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const refCode = searchParams.get("ref");

        if (refCode && typeof window !== "undefined") {
            // Store referral with 7-day expiry
            const referralData: ReferralData = {
                code: refCode.trim(),
                expiresAt: Date.now() + REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
            };

            localStorage.setItem(REFERRAL_KEY, JSON.stringify(referralData));
        }
    }, [searchParams]);

    return null; // This component doesn't render anything
}

/**
 * Get the stored referral code if it exists and hasn't expired
 */
export function getStoredReferralCode(): string | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(REFERRAL_KEY);
        if (!stored) return null;

        const data: ReferralData = JSON.parse(stored);

        // Check if expired
        if (Date.now() > data.expiresAt) {
            localStorage.removeItem(REFERRAL_KEY);
            return null;
        }

        return data.code;
    } catch {
        return null;
    }
}

/**
 * Clear the stored referral code (call after successful signup)
 */
export function clearStoredReferralCode(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(REFERRAL_KEY);
    }
}
