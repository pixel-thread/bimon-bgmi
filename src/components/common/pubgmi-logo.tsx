"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Animated PUBGMI logo that morphs between PUBG → PUBGMI → BGMI
 * with a glitch effect during transitions.
 *
 * Variants:
 * - "hero"   → large text for the landing page
 * - "header" → small text for navbar/sidebar
 */
interface PubgmiLogoProps {
    variant?: "hero" | "header";
    className?: string;
}

const WORDS = ["PUBGMI", "PUBG", "PUBGMI", "BGMI"];
const DISPLAY_DURATION = 2400; // ms to hold each word
const GLITCH_DURATION = 600; // ms for glitch transition

export function PubgmiLogo({ variant = "header", className }: PubgmiLogoProps) {
    const [wordIndex, setWordIndex] = useState(0);
    const [isGlitching, setIsGlitching] = useState(false);
    const [displayText, setDisplayText] = useState(WORDS[0]);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const cycle = () => {
            // Start glitch
            setIsGlitching(true);

            // Midway through glitch, swap the text
            timeoutRef.current = setTimeout(() => {
                setWordIndex((prev) => {
                    const next = (prev + 1) % WORDS.length;
                    setDisplayText(WORDS[next]);
                    return next;
                });
            }, GLITCH_DURATION / 2);

            // End glitch
            setTimeout(() => {
                setIsGlitching(false);
            }, GLITCH_DURATION);
        };

        const interval = setInterval(cycle, DISPLAY_DURATION + GLITCH_DURATION);

        return () => {
            clearInterval(interval);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const letters = displayText.split("");

    return (
        <span
            className={`pubgmi-logo inline-flex items-baseline select-none ${isGlitching ? "pubgmi-glitching" : ""} ${className || ""}`}
            aria-label="PUBGMI"
        >
            {letters.map((letter, i) => (
                <span
                    key={`${displayText}-${i}`}
                    className="pubgmi-letter"
                    style={{ animationDelay: `${i * (isGlitching ? 40 : 50)}ms` }}
                >
                    {letter}
                </span>
            ))}
        </span>
    );
}

